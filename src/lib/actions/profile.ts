"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";

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

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  // Validate file size (2MB)
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

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${user.id}/${timestamp}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: "Failed to upload avatar" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile
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

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true, url: publicUrl };
}
