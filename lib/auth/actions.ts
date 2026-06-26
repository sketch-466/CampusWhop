"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ─── REGISTER ───────────────────────────────────────────────
export async function registerAction(
  prevState: { error: string },
  formData: FormData
) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/verify`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  redirect("/auth/verify");
}

// ─── LOGIN ───────────────────────────────────────────────────
export async function loginAction(
  prevState: { error: string },
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .returns<{ onboarding_completed: boolean }[]>()
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}


// ─── LOGOUT ──────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────
export async function forgotPasswordAction(
  prevState: { error?: string; success?: string },
  formData: FormData
) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent. Check your email." };
}

// ─── RESET PASSWORD ──────────────────────────────────────────
export async function resetPasswordAction(
  prevState: { error: string },
  formData: FormData
) {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password || !confirmPassword) {
    return { error: "Both fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/login?message=Password updated successfully");
}

// ─── ONBOARDING ──────────────────────────────────────────────
export async function onboardingAction(
  prevState: { error: string },
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const username = (formData.get("username") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const universityId = formData.get("university_id") as string;
  const department = formData.get("department") as string;
  const level = formData.get("level") as string;
  const matricNumber = formData.get("matric_number") as string;

  if (!username || !universityId || !department || !level) {
    return { error: "Username, university, department and level are required." };
  }

  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return {
      error: "Username must be 3-20 characters, letters, numbers and underscores only.",
    };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) {
    return { error: "This username is already taken. Please choose another." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      phone: phone || null,
      university_id: universityId,
      department,
      level,
      matric_number: matricNumber || null,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
