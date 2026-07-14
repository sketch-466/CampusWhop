"use server";

import { createClient } from "@/lib/supabase/server";
import { paystackRequest } from "@/lib/paystack/client";

const PLATFORM_FEE_PERCENT = 0.10;

export async function initializeStoreOrder(storeProductId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: product } = await supabase
    .from("store_products")
    .select(`
      *,
      store:stores!store_products_store_id_fkey(id, owner_id, status, store_name)
    `)
    .eq("id", storeProductId)
    .single();

  if (!product) return { error: "Product not found" };

  const store = Array.isArray(product.store) ? product.store[0] : product.store;

  if (product.status !== "active") return { error: "Product is not available for purchase" };
  if (store?.status !== "active") return { error: "Store is not currently active" };
  if (store?.owner_id === user.id) return { error: "You cannot buy your own product" };

  if (product.product_type === "physical" && product.stock_quantity !== null && product.stock_quantity <= 0) {
    return { error: "This product is out of stock" };
  }

  const { data: subaccount } = await supabase
    .from("paystack_subaccounts")
    .select("subaccount_code")
    .eq("user_id", store.owner_id)
    .single();

  if (!subaccount) return { error: "Seller has not set up payout account yet" };

  const amount = product.price;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const sellerAmount = amount - platformFee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_product_id: storeProductId,
      buyer_id: user.id,
      seller_id: store.owner_id,
      amount,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) return { error: "Failed to create order" };

  try {
    const result = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100),
        reference: `cw_${order.id}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders`,
        subaccount: subaccount.subaccount_code,
        transaction_charge: Math.round(platformFee * 100),
        bearer: "account",
        metadata: {
          order_id: order.id,
          store_product_id: storeProductId,
          buyer_id: user.id,
          seller_id: store.owner_id,
        },
      }),
    });

    if (!result.status) throw new Error(result.message);

    await supabase
      .from("orders")
      .update({ paystack_reference: result.data.reference })
      .eq("id", order.id);

    return { success: true, authorizationUrl: result.data.authorization_url };
  } catch (err) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: err instanceof Error ? err.message : "Failed to initialize payment" };
  }
}
