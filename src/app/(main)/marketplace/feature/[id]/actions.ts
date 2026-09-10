"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getFeatureProduct(id: string, type: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const admin = createAdminClient();

    if (type === "product") {
      const { data, error } = await admin
        .from("store_products")
        .select("id, title, is_featured, featured_until, store_id, stores!inner(owner_id)")
        .eq("id", id)
        .single();

      if (error || !data) return { success: false, error: "Product not found." };

      const store = Array.isArray(data.stores) ? data.stores[0] : data.stores as any;
      if (store?.owner_id !== user.id) return { success: false, error: "You don't own this product." };

      return {
        success: true,
        email: user.email,
        product: {
          id: data.id,
          title: data.title,
          is_featured: data.is_featured,
          featured_until: data.featured_until,
        },
      };

    } else {
      const { data, error } = await admin
        .from("listings")
        .select("id, title, is_featured, featured_until, seller_id")
        .eq("id", id)
        .single();

      if (error || !data) return { success: false, error: "Listing not found." };
      if (data.seller_id !== user.id) return { success: false, error: "You don't own this listing." };

      return {
        success: true,
        email: user.email,
        product: {
          id: data.id,
          title: data.title,
          is_featured: data.is_featured,
          featured_until: data.featured_until,
        },
      };
    }

  } catch (err) {
    console.error("getFeatureProduct error:", err);
    return { success: false, error: "Server error." };
  }
}

const PLAN_AMOUNTS: Record<string, number> = {
  "3": 50000,
  "7": 100000,
  "14": 180000,
  "30": 300000,
};

export async function initializeFeaturePayment(
  product_id: string,
  product_type: string,
  days: number
) {
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated." };

    const amount = PLAN_AMOUNTS[String(days)];
    if (!amount) return { error: "Invalid plan." };

    const reference = `cw_feature_${product_id}_${days}_${Date.now()}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/feature/callback?reference=${reference}`,
        metadata: {
          product_id,
          product_type,
          days,
        },
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) return { error: "Failed to initialize payment." };

    return { url: paystackData.data.authorization_url };

  } catch (err) {
    console.error("initializeFeaturePayment error:", err);
    return { error: "Server error." };
  }
}