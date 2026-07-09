"use server";

import { createClient } from "@/lib/supabase/server";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";
import { revalidatePath } from "next/cache";

// Helper to normalize Supabase joined relation
function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

interface SellerProfile {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  reputation_score: number | null;
  total_reviews: number | null;
}

// ... keep createListing, uploadListingImage unchanged ...

export async function getActiveListings(filters?: {
  category?: string;
  search?: string;
  product_type?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(`
      *,
      seller:profiles(full_name, avatar_url, university, reputation_score, total_reviews)
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.product_type) {
    query = query.eq("product_type", filters.product_type);
  }

  if (filters?.search) {
    query = query.textSearch("title", filters.search, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error } = await query;

  if (error) {
    return { error: "Failed to fetch listings" };
  }

  // Normalize seller relations
  const listings = (data || []).map((item) => ({
    ...item,
    seller: normalizeRelation<SellerProfile>(item.seller as SellerProfile | SellerProfile[] | null),
  }));

  return { listings };
}

export async function getListingById(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      seller:profiles(full_name, avatar_url, university, matric_number, reputation_score, total_reviews)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return { error: "Listing not found" };
  }

  // Only return active listings to non-owners
  if (data.status !== "active" && data.seller_id !== user?.id) {
    return { error: "Listing not available" };
  }

  // Increment view count
  if (data.seller_id !== user?.id) {
    await supabase
      .from("listings")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", id);
  }

  const listing = {
    ...data,
    seller: normalizeRelation<SellerProfile>(data.seller as SellerProfile | SellerProfile[] | null),
  };

  return { listing };
}

// ... keep getUserListings, deleteListing, getPendingListings, approveListing, rejectListing unchanged ...
