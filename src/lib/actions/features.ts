"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── ADMIN ACTIONS ────────────────────────────────────────────────

export async function adminFeatureListing(
  listingId: string,
  durationDays: number = 30
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { success: false, error: "Unauthorized" };

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + durationDays);

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("listings")
    .update({
      is_featured: true,
      featured_until: featuredUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return { success: false, error: "Failed to feature listing" };

  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  revalidatePath("/");
  return { success: true };
}

export async function adminUnfeatureListing(
  listingId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { success: false, error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("listings")
    .update({
      is_featured: false,
      featured_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return { success: false, error: "Failed to unfeature listing" };

  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  revalidatePath("/");
  return { success: true };
}

export async function adminFeatureStoreProduct(
  productId: string,
  durationDays: number = 30
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { success: false, error: "Unauthorized" };

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + durationDays);

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("store_products")
    .update({
      is_featured: true,
      featured_until: featuredUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to feature product" };

  revalidatePath("/admin/stores");
  revalidatePath("/store");
  revalidatePath("/");
  return { success: true };
}

export async function adminUnfeaturedStoreProduct(
  productId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { success: false, error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("store_products")
    .update({
      is_featured: false,
      featured_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to unfeature product" };

  revalidatePath("/admin/stores");
  revalidatePath("/store");
  revalidatePath("/");
  return { success: true };
}

// ─── PUBLIC QUERY ─────────────────────────────────────────────────

export async function getFeaturedItems() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [listingsResult, productsResult] = await Promise.all([
    supabase
      .from("listings")
      .select(`
        id, title, price, images, category, product_type, status,
        seller:profiles!listings_seller_id_fkey(full_name, avatar_url, reputation_score, total_reviews, is_founding_creator)
      `)
      .eq("status", "active")
      .eq("is_featured", true)
      .gt("featured_until", now)
      .is("deleted_at", null)
      .order("featured_until", { ascending: false })
      .limit(6),

    supabase
      .from("store_products")
      .select(`
        id, title, price, images, product_type, status, delivery_timeframe,
        store:stores!store_products_store_id_fkey(slug, store_name)
      `)
      .eq("status", "active")
      .eq("is_featured", true)
      .gt("featured_until", now)
      .eq("is_deleted", false)
      .order("featured_until", { ascending: false })
      .limit(6),
  ]);

  const listings = (listingsResult.data || []).map((item) => ({
    ...item,
    _type: "listing" as const,
    seller: Array.isArray(item.seller) ? item.seller[0] : item.seller,
  }));

  const products = (productsResult.data || []).map((item) => ({
    ...item,
    _type: "store_product" as const,
    store: Array.isArray(item.store) ? item.store[0] : item.store,
  }));

  return { listings, products };
}

// ─── EXPIRE CRON (called by Trigger.dev) ─────────────────────────

export async function expireFeaturedItems() {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const [l, p] = await Promise.all([
    adminClient
      .from("listings")
      .update({ is_featured: false, featured_until: null })
      .eq("is_featured", true)
      .lt("featured_until", now),
    adminClient
      .from("store_products")
      .update({ is_featured: false, featured_until: null })
      .eq("is_featured", true)
      .lt("featured_until", now),
  ]);

  return {
    expiredListings: l.count ?? 0,
    expiredProducts: p.count ?? 0,
  };
}