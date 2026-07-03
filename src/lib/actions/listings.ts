"use server";

import { createClient } from "@/lib/supabase/server";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";
import { revalidatePath } from "next/cache";

export async function createListing(data: ListingInput, images: string[]) {
  const validated = listingSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: validated.data.title,
      description: validated.data.description,
      price: validated.data.price,
      product_type: validated.data.product_type,
      category: validated.data.category,
      delivery_note: validated.data.delivery_note || null,
      images,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: "Failed to create listing" };
  }

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-listings");
  return { success: true, listingId: listing.id };
}

export async function uploadListingImage(formData: FormData, listingId: string) {
  const file = formData.get("image") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File must be less than 5MB" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${user.id}/${listingId}/${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("listings")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: "Failed to upload image" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listings").getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}

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
      seller:profiles(full_name, avatar_url, university)
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

  return { listings: data || [] };
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
      seller:profiles(full_name, avatar_url, university, matric_number)
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

  return { listing: data };
}

export async function getUserListings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to fetch listings" };
  }

  return { listings: data || [] };
}

export async function deleteListing(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("listings")
    .update({
      deleted_at: new Date().toISOString(),
      status: "deleted",
    })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    return { error: "Failed to delete listing" };
  }

  revalidatePath("/marketplace/my-listings");
  return { success: true };
}

// Admin actions
export async function getPendingListings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      seller:profiles(full_name, email, university)
    `)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to fetch pending listings" };
  }

  return { listings: data || [] };
}

export async function approveListing(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    return { error: "Failed to approve listing" };
  }

  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function rejectListing(id: string, reason: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", id);

  if (error) {
    return { error: "Failed to reject listing" };
  }

  revalidatePath("/admin/listings");
  return { success: true };
}
