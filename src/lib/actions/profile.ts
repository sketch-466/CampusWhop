"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";
import { uploadToB2, deleteFromB2, generateFileName } from "@/lib/storage/b2";

export async function updateProfile(formData: ProfileInput) {
  const validated = profileSchema.safeParse(formData);
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

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: validated.data.full_name,
      bio: validated.data.bio || null,
      phone_number: validated.data.phone_number || null,
      whatsapp_number: validated.data.whatsapp_number || null,
      twitter_url: validated.data.twitter_url || null,
      linkedin_url: validated.data.linkedin_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update profile" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File must be less than 2MB" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get existing avatar URL to delete from B2 after upload
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${user.id}-${generateFileName(file.name)}`;

  // Upload to B2
  let publicUrl: string;
  try {
    publicUrl = await uploadToB2(buffer, fileName, "avatars", file.type);
  } catch {
    return { error: "Failed to upload avatar" };
  }

  // Update profile with new URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: "Failed to update profile with avatar" };
  }

  // Delete old avatar from B2 if it existed and was a B2 URL
  if (profile?.avatar_url && profile.avatar_url.includes("backblazeb2.com")) {
    await deleteFromB2(profile.avatar_url);
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, url: publicUrl };
}