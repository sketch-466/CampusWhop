"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackRequest, calculatePlatformFee } from "@/lib/paystack/client";
import { revalidatePath } from "next/cache";

export async function initializeOrder(listingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*, seller:profiles(id, full_name, email, fee_exempt_until)")
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

  const { data: subaccount } = await supabase
    .from("paystack_subaccounts")
    .select("subaccount_code")
    .eq("user_id", listing.seller_id)
    .single();

  if (!subaccount) {
    return { error: "Seller has not set up payout account yet" };
  }

  const amount = listing.price;

  const seller = Array.isArray(listing.seller)
    ? listing.seller[0]
    : listing.seller;
  const { platformFee, sellerAmount } = calculatePlatformFee(
    amount,
    seller?.fee_exempt_until
  );

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

  try {
    const isDirectPay = listing.payment_type === "direct";

    const paystackBody: Record<string, unknown> = {
      email: user.email,
      amount: Math.round(amount * 100),
      reference: `cw_${order.id}`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders`,
      metadata: {
        order_id: order.id,
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        payment_type: listing.payment_type,
      },
    };

    if (isDirectPay) {
      paystackBody.subaccount = subaccount.subaccount_code;
      paystackBody.bearer = "subaccount";
    } else {
      paystackBody.subaccount = subaccount.subaccount_code;
      paystackBody.transaction_charge = Math.round(platformFee * 100);
      paystackBody.bearer = "account";
    }

    const result = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(paystackBody),
    });

    if (!result.status) {
      throw new Error(result.message);
    }

    await supabase
      .from("orders")
      .update({ paystack_reference: result.data.reference })
      .eq("id", order.id);

    return { success: true, authorizationUrl: result.data.authorization_url };
  } catch (err) {
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
    const result = await paystackRequest(`/transaction/verify/${reference}`);

    if (!result.status || result.data.status !== "success") {
      return { error: "Payment verification failed" };
    }

    const { data: order } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("paystack_reference", reference)
      .select()
      .single();

    if (!order) {
      return { error: "Order not found" };
    }

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

export async function acceptOrder(orderId: string) {
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
    .eq("seller_id", user.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "paid") {
    return { error: "Order cannot be accepted" };
  }

  await supabase
    .from("orders")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/orders");
  return { success: true };
}

export async function markOrderDelivered(orderId: string) {
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
    .eq("seller_id", user.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "accepted") {
    return { error: "Order must be accepted before marking as delivered" };
  }

  await supabase
    .from("orders")
    .update({
      status: "shipped",
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidatePath("/orders");
  return { success: true };
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

  if (!["paid", "shipped"].includes(order.status)) {
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
  const adminClient = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, listing:listings(product_type)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (
    order.listing?.product_type === "physical" &&
    order.status !== "delivered"
  ) {
    return { error: "Physical order must be delivered first" };
  }

  await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (order.listing?.product_type === "physical" && order.listing_id) {
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", order.listing_id);
  }

  const { data: subaccount } = await adminClient
    .from("paystack_subaccounts")
    .select("subaccount_code")
    .eq("user_id", order.seller_id)
    .single();

  if (!subaccount) {
    console.error("Seller subaccount not found for order:", orderId);
    revalidatePath("/orders");
    return {
      success: true,
      warning: "Order completed but payout could not be initiated",
    };
  }

  try {
    const recipientResult = await paystackRequest("/transferrecipient", {
      method: "POST",
      body: JSON.stringify({
        type: "subaccount",
        account_number: subaccount.subaccount_code,
        currency: "NGN",
      }),
    });

    if (!recipientResult.status) {
      throw new Error(
        recipientResult.message ?? "Failed to create transfer recipient"
      );
    }

    const recipientCode = recipientResult.data.recipient_code;
    const transferAmount = Math.round(order.seller_amount * 100);

    const transferResult = await paystackRequest("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: transferAmount,
        recipient: recipientCode,
        reason: `CampusWhop payout for order ${orderId}`,
        reference: `payout_${orderId}`,
      }),
    });

    if (!transferResult.status) {
      throw new Error(transferResult.message ?? "Transfer initiation failed");
    }

    await adminClient
      .from("orders")
      .update({
        paystack_transfer_code: transferResult.data.transfer_code,
      })
      .eq("id", orderId);

    console.log(
      "Transfer initiated for order:",
      orderId,
      transferResult.data.transfer_code
    );
  } catch (err) {
    console.error("Payout transfer failed for order:", orderId, err);
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

  if (!["paid", "accepted", "shipped", "delivered"].includes(order.status)) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  if (buyingError)
    return { error: `Buying query failed: ${buyingError.message}` };
  if (sellingError)
    return { error: `Selling query failed: ${sellingError.message}` };

  return {
    buying: buying || [],
    selling: selling || [],
  };
}