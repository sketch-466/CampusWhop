"use server";

import { createClient } from "@/lib/supabase/server";
import { paystackRequest } from "@/lib/paystack/client";
import { revalidatePath } from "next/cache";

const PLATFORM_FEE_PERCENT = 0.10; // 10%

export async function initializeOrder(listingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get listing
  const { data: listing } = await supabase
    .from("listings")
    .select("*, seller:profiles(id, full_name, email)")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { error: "Listing not found" };
  }

  if (listing.status !== "active") {
    return { error: "Listing is not available for purchase" };
  }

  if (listing.seller_id === user.id) {
    return { error: "You cannot buy your own listing" };
  }

  // Check seller has subaccount
  const { data: subaccount } = await supabase
    .from("paystack_subaccounts")
    .select("subaccount_code")
    .eq("user_id", listing.seller_id)
    .single();

  if (!subaccount) {
    return { error: "Seller has not set up payout account yet" };
  }

  const amount = listing.price;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const sellerAmount = amount - platformFee;

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: "Failed to create order" };
  }

  // Initialize Paystack transaction
  try {
    const result = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // kobo
        reference: `cw_${order.id}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders`,
        subaccount: subaccount.subaccount_code,
        transaction_charge: Math.round(platformFee * 100), // platform fee in kobo
        bearer: "account", // platform bears the charge
        metadata: {
          order_id: order.id,
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        },
      }),
    });

    if (!result.status) {
      throw new Error(result.message);
    }

    // Update order with reference
    await supabase
      .from("orders")
      .update({ paystack_reference: result.data.reference })
      .eq("id", order.id);

    return { success: true, authorizationUrl: result.data.authorization_url };
  } catch (err) {
    // Delete the pending order
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      error:
        err instanceof Error ? err.message : "Failed to initialize payment",
    };
  }
}

export async function verifyPayment(reference: string) {
  const supabase = await createClient();

  try {
    const result = await paystackRequest(
      `/transaction/verify/${reference}`
    );

    if (!result.status || result.data.status !== "success") {
      return { error: "Payment verification failed" };
    }

    // Update order
    const { data: order } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("paystack_reference", reference)
      .select()
      .single();

    if (!order) {
      return { error: "Order not found" };
    }

    // For digital products, auto-complete
    const { data: listing } = await supabase
      .from("listings")
      .select("product_type")
      .eq("id", order.listing_id)
      .single();

    if (listing?.product_type === "digital") {
      await releaseEscrow(order.id);
    }

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Payment verification failed",
    };
  }
}

export async function confirmDelivery(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "paid") {
    return { error: "Order cannot be confirmed" };
  }

  await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivery_confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await releaseEscrow(orderId);

  revalidatePath("/orders");
  return { success: true };
}

export async function releaseEscrow(orderId: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, listing:listings(product_type)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  // For digital, auto-release. For physical, must be delivered.
  if (
    order.listing.product_type === "physical" &&
    order.status !== "delivered"
  ) {
    return { error: "Physical order must be delivered first" };
  }

  // Update order to completed
  await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // Update listing to sold if physical
  if (order.listing.product_type === "physical") {
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", order.listing_id);
  }

  revalidatePath("/orders");
  return { success: true };
}

export async function disputeOrder(orderId: string, reason: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (!["paid", "delivered"].includes(order.status)) {
    return { error: "Order cannot be disputed" };
  }

  await supabase
    .from("orders")
    .update({
      status: "disputed",
      disputed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/orders");
  return { success: true };
}

export async function getUserOrders() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: buying, error: buyingError } = await supabase
    .from("orders")
    .select(`
      *,
      listing:listings(title, images, product_type)
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const { data: selling, error: sellingError } = await supabase
  .from("orders")
  .select(`
    *,
    listing:listings(title, images, product_type),
    buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url)
  `)
  .eq("seller_id", user.id)
  .order("created_at", { ascending: false });

  if (buyingError) return { error: `Buying query failed: ${buyingError.message}` };
  if (sellingError) return { error: `Selling query failed: ${sellingError.message}` };

  return {
    buying: buying || [],
    selling: selling || [],
  };
}