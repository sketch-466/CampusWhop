// src/lib/actions/profile.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validations/profile";

export async function updateProfile(data: {
  full_name?: string;
  bio?: string;
  phone_number?: string;
  whatsapp_number?: string;
  twitter_url?: string;
  linkedin_url?: string;
  tagline?: string;
  creator_type?: string | null;
  skills?: string[];
  portfolio_url?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      bio: data.bio,
      phone_number: data.phone_number,
      whatsapp_number: data.whatsapp_number,
      twitter_url: data.twitter_url,
      linkedin_url: data.linkedin_url,
      tagline: data.tagline,
      creator_type: data.creator_type,
      skills: data.skills,
      portfolio_url: data.portfolio_url,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return {};
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", url: null };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided", url: null };
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File too large (max 2MB)", url: null };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message, url: null };
  }

  revalidatePath("/profile");
  return { error: null, url: publicUrl };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Soft delete the profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      full_name: "Deleted User",
      avatar_url: null,
      bio: null,
      phone_number: null,
      whatsapp_number: null,
      twitter_url: null,
      linkedin_url: null,
      portfolio_url: null,
      tagline: null,
      skills: null,
      creator_type: null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Failed to delete account" };
  }

  // Soft delete their listings
  await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "deleted" })
    .eq("seller_id", user.id);

  // Soft delete their store
  await supabase
    .from("stores")
    .update({ is_deleted: true })
    .eq("owner_id", user.id);

  // Sign out
  await supabase.auth.signOut();

  // Delete the auth user via admin client
  await adminClient.auth.admin.deleteUser(user.id);

  revalidatePath("/");
  redirect("/login");
}
