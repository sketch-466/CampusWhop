"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export async function getFeatureProduct(id: string, type: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated." };
    }

    const admin = createAdminClient();

    if (type === "product") {
      const { data, error } = await admin
        .from("store_products")
        .select("id, title, is_featured, featured_until, store_id, stores!inner(owner_id)")
        .eq("id", id)
        .single();

      if (error || !data) {
        return { success: false, error: "Product not found." };
      }

      const store = Array.isArray(data.stores) ? data.stores[0] : data.stores as any;

      if (store?.owner_id !== user.id) {
        return { success: false, error: "You don't own this product." };
      }

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

      if (error || !data) {
        return { success: false, error: "Listing not found." };
      }

      if (data.seller_id !== user.id) {
        return { success: false, error: "You don't own this listing." };
      }

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