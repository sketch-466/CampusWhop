"use server";

import { createClient } from "@/lib/supabase/server";
import { storeSchema, storeProductSchema } from "@/lib/validations/store";
import { revalidatePath } from "next/cache";
import { uploadToB2, generateFileName } from "@/lib/storage/b2";

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

interface StoreWithOwner {
  id: string;
  slug: string;
  store_name: string;
  tagline: string | null;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  owner_id: string;
  owner: {
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
    reputation_score: number | null;
    total_reviews: number | null;
  } | null;
}

interface StoreProduct {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price: number;
  product_type: string;
  images: string[];
  stock_quantity: number | null;
  digital_file_url: string | null;
  delivery_timeframe: string | null;
  requirements: string | null;
  status: string;
  views_count: number;
  units_sold: number;
  created_at: string;
}

function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

export async function createStore(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in to create a store" };
  }

  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingStore) {
    return { success: false, error: "You already have a store. Only one store per account is allowed." };
  }

  const rawData = {
    store_name: formData.get("store_name") as string,
    slug: (formData.get("slug") as string)?.toLowerCase().trim(),
    tagline: (formData.get("tagline") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    banner_url: (formData.get("banner_url") as string) || undefined,
    logo_url: (formData.get("logo_url") as string) || undefined,
  };

  const parsed = storeSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    };
  }

  const data = parsed.data;

  const { data: slugExists } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", data.slug)
    .maybeSingle();

  if (slugExists) {
    return { success: false, error: "This slug is already taken. Try another one." };
  }

  const { data: store, error: insertError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      slug: data.slug,
      store_name: data.store_name,
      tagline: data.tagline || null,
      description: data.description || null,
      banner_url: data.banner_url || null,
      logo_url: data.logo_url || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "This slug is already taken. Try another one." };
    }
    return { success: false, error: "Failed to create store. Please try again." };
  }

  revalidatePath("/store/dashboard");
  return { success: true, id: store.id };
}

export async function updateStore(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const storeId = formData.get("store_id") as string;

  const rawData = {
    store_name: formData.get("store_name") as string,
    slug: (formData.get("slug") as string)?.toLowerCase().trim(),
    tagline: (formData.get("tagline") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    banner_url: (formData.get("banner_url") as string) || undefined,
    logo_url: (formData.get("logo_url") as string) || undefined,
  };

  const parsed = storeSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    };
  }

  const data = parsed.data;

  const { data: currentStore } = await supabase
    .from("stores")
    .select("slug")
    .eq("id", storeId)
    .eq("owner_id", user.id)
    .single();

  if (!currentStore) {
    return { success: false, error: "Store not found" };
  }

  if (currentStore.slug !== data.slug) {
    const { data: slugExists } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", storeId)
      .maybeSingle();

    if (slugExists) {
      return { success: false, error: "This slug is already taken. Try another one." };
    }
  }

  const { error: updateError } = await supabase
    .from("stores")
    .update({
      store_name: data.store_name,
      slug: data.slug,
      tagline: data.tagline || null,
      description: data.description || null,
      banner_url: data.banner_url || null,
      logo_url: data.logo_url || null,
    })
    .eq("id", storeId)
    .eq("owner_id", user.id);

  if (updateError) {
    return { success: false, error: "Failed to update store. Please try again." };
  }

  revalidatePath("/store/dashboard");
  revalidatePath(`/store/${data.slug}`);
  return { success: true };
}

export async function getMyStore() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { store: null };

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) return { store: null };

  return { store: data };
}

export async function getStoreBySlug(slug: string): Promise<{ store: StoreWithOwner | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .select(`
      *,
      owner:profiles!stores_owner_id_fkey(full_name, avatar_url, university, reputation_score, total_reviews)
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_deleted", false)
    .single();

  if (error || !data) {
    return { store: null, error: "Store not found" };
  }

  const store: StoreWithOwner = {
    ...data,
    owner: normalizeRelation(data.owner as any),
  };

  return { store };
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; error?: string }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug.toLowerCase().trim())
    .maybeSingle();

  return { available: !data };
}

export async function createStoreProduct(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, status")
    .eq("owner_id", user.id)
    .single();

  if (!store) {
    return { success: false, error: "You need to create a store first" };
  }

  if (store.status !== "active") {
    return { success: false, error: "Your store must be approved before you can add products" };
  }

  const productType = formData.get("product_type") as string;

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
    product_type: productType,
    images: JSON.parse((formData.get("images") as string) || "[]"),
    stock_quantity: formData.get("stock_quantity")
      ? parseInt(formData.get("stock_quantity") as string, 10)
      : undefined,
    digital_file_url: (formData.get("digital_file_url") as string) || undefined,
    delivery_timeframe: (formData.get("delivery_timeframe") as string) || undefined,
    requirements: (formData.get("requirements") as string) || undefined,
  };

  const parsed = storeProductSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    };
  }

  const data = parsed.data;
  const finalStock = data.product_type === "physical" ? data.stock_quantity : null;

  const { data: product, error: insertError } = await supabase
    .from("store_products")
    .insert({
      store_id: store.id,
      title: data.title,
      description: data.description,
      price: data.price,
      product_type: data.product_type,
      images: data.images,
      stock_quantity: finalStock,
      digital_file_url: data.product_type === "digital" ? data.digital_file_url || null : null,
      delivery_timeframe: data.product_type === "service" ? data.delivery_timeframe || null : null,
      requirements: data.product_type === "service" ? data.requirements || null : null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return { success: false, error: "Failed to create product. Please try again." };
  }

  revalidatePath("/store/dashboard");
  revalidatePath(`/store/${store.id}`);
  return { success: true, id: product.id };
}

export async function updateStoreProduct(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const productId = formData.get("product_id") as string;
  const productType = formData.get("product_type") as string;

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
    product_type: productType,
    images: JSON.parse((formData.get("images") as string) || "[]"),
    stock_quantity: formData.get("stock_quantity")
      ? parseInt(formData.get("stock_quantity") as string, 10)
      : undefined,
    digital_file_url: (formData.get("digital_file_url") as string) || undefined,
    delivery_timeframe: (formData.get("delivery_timeframe") as string) || undefined,
    requirements: (formData.get("requirements") as string) || undefined,
  };

  const parsed = storeProductSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    };
  }

  const data = parsed.data;
  const finalStock = data.product_type === "physical" ? data.stock_quantity : null;

  const { data: product } = await supabase
    .from("store_products")
    .select("id, store_id, stores!inner(owner_id)")
    .eq("id", productId)
    .single();

  if (!product || (product.stores as any)?.owner_id !== user.id) {
    return { success: false, error: "Product not found or you don't have permission" };
  }

  const { error: updateError } = await supabase
    .from("store_products")
    .update({
      title: data.title,
      description: data.description,
      price: data.price,
      product_type: data.product_type,
      images: data.images,
      stock_quantity: finalStock,
      digital_file_url: data.product_type === "digital" ? data.digital_file_url || null : null,
      delivery_timeframe: data.product_type === "service" ? data.delivery_timeframe || null : null,
      requirements: data.product_type === "service" ? data.requirements || null : null,
    })
    .eq("id", productId);

  if (updateError) {
    return { success: false, error: "Failed to update product. Please try again." };
  }

  revalidatePath("/store/dashboard");
  return { success: true };
}

export async function archiveStoreProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: product } = await supabase
    .from("store_products")
    .select("id, store_id, stores!inner(owner_id, slug)")
    .eq("id", productId)
    .single();

  if (!product || (product.stores as any)?.owner_id !== user.id) {
    return { success: false, error: "Product not found or you don't have permission" };
  }

  const { error } = await supabase
    .from("store_products")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      status: "archived",
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: "Failed to archive product" };
  }

  revalidatePath("/store/dashboard");
  revalidatePath(`/store/${(product.stores as any)?.slug}`);
  return { success: true };
}

export async function getStoreProducts(storeId: string, includePending = false) {
  const supabase = await createClient();

  let query = supabase
    .from("store_products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (!includePending) {
    query = query.in("status", ["active", "demo", "sold_out"]);
  }

  const { data, error } = await query;

  if (error) {
    return { products: [] as StoreProduct[], error: "Failed to fetch products" };
  }

  return { products: (data || []) as StoreProduct[] };
}

export async function getStoreProductById(productId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("store_products")
    .select(`
      *,
      store:stores!store_products_store_id_fkey(id, slug, store_name, owner_id, status)
    `)
    .eq("id", productId)
    .single();

  if (error || !data) {
    return { product: null, error: "Product not found" };
  }

  const store = normalizeRelation(data.store as any);
  const isOwner = user?.id === store?.owner_id;

  if (!isOwner && (store?.status !== "active" || data.status !== "active" || data.is_deleted)) {
    return { product: null, error: "Product not available" };
  }

  if (!isOwner && data.status === "active") {
    await supabase
      .from("store_products")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", productId);
  }

  return { product: data as StoreProduct };
}

export async function uploadStoreImage(formData: FormData) {
  const file = formData.get("image") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File must be less than 5MB" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${user.id}-${generateFileName(file.name)}`;

  try {
    const url = await uploadToB2(buffer, fileName, "store-assets", file.type);
    return { success: true, url };
  } catch {
    return { success: false, error: "Failed to upload image" };
  }
}

export async function getPendingStores() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("stores")
    .select(`
      *,
      owner:profiles!stores_owner_id_fkey(full_name, email, university)
    `)
    .eq("status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to fetch pending stores" };
  }

  return { stores: data || [] };
}

export async function getPendingStoreProducts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("store_products")
    .select(`
      *,
      store:stores!store_products_store_id_fkey(store_name, slug, owner_id)
    `)
    .eq("status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to fetch pending products" };
  }

  return { products: data || [] };
}