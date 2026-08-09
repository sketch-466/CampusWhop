"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend/client";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "@/lib/resend/templates";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getExpiration(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function registerUser(formData: RegisterInput) {
  const validated = registerSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email, password, fullName } = validated.data;

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to create account" };
  }

  const userId = authData.user.id;

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (profileError) {
    return { error: "Failed to update profile" };
  }

  const token = generateToken();
  const expiresAt = getExpiration(24);

  const { error: tokenError } = await adminClient
    .from("email_verification_tokens")
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

  if (tokenError) {
    return { error: "Failed to generate verification token" };
  }

  const verifyUrl = `${SITE_URL}/verify?token=${token}`;
  try {
    await resend.emails.send({
      from: "CampusWhop <noreply@campuswhop.com>",
      to: email,
      subject: "Verify your CampusWhop account",
      html: verificationEmailTemplate(verifyUrl),
    });
  } catch {
    return { error: "Failed to send verification email" };
  }

  return { success: true, message: "Check your email for verification link" };
}

export async function verifyEmail(token: string) {
  const adminClient = createAdminClient();

  const { data: tokenData, error: tokenError } = await adminClient
    .from("email_verification_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return { error: "Invalid or expired token" };
  }

  if (tokenData.used_at) {
    return { error: "Token has already been used" };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { error: "Token has expired" };
  }

  const { error: updateTokenError } = await adminClient
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  if (updateTokenError) {
    return { error: "Failed to verify token" };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", tokenData.user_id);

  if (profileError) {
    return { error: "Failed to verify email" };
  }

  return { success: true, redirect: "/onboarding" };
}

export async function resendVerificationEmail(userId: string) {
  const adminClient = createAdminClient();

  const { data: recentTokens } = await adminClient
    .from("email_verification_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentTokens && recentTokens.length > 0) {
    const lastCreated = new Date(recentTokens[0].created_at);
    const secondsSince = (Date.now() - lastCreated.getTime()) / 1000;
    if (secondsSince < 60) {
      return {
        error: `Please wait ${Math.ceil(60 - secondsSince)} seconds before requesting another email`,
      };
    }
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { error: "User not found" };
  }

  const token = generateToken();
  const expiresAt = getExpiration(24);

  const { error: tokenError } = await adminClient
    .from("email_verification_tokens")
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

  if (tokenError) {
    return { error: "Failed to generate new token" };
  }

  const verifyUrl = `${SITE_URL}/verify?token=${token}`;
  try {
    await resend.emails.send({
      from: "CampusWhop <noreply@campuswhop.com>",
      to: profile.email,
      subject: "Verify your CampusWhop account",
      html: verificationEmailTemplate(verifyUrl),
    });
  } catch {
    return { error: "Failed to send verification email" };
  }

  return { success: true, message: "Verification email sent" };
}

export async function loginUser(
  formData: LoginInput,
  redirectTo: string = "/dashboard"
) {
  const validated = loginSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email, password } = validated.data;

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    return { error: authError?.message || "Invalid credentials" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified, onboarding_completed")
    .eq("id", authData.user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  if (!profile.email_verified) {
    return {
      error: "Please verify your email before logging in",
      unverified: true,
      userId: authData.user.id,
    };
  }

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  // Honour the original destination, but never redirect back to auth pages
  const safeRedirect =
    redirectTo.startsWith("/login") ||
    redirectTo.startsWith("/register") ||
    redirectTo === "/"
      ? "/dashboard"
      : redirectTo;

  redirect(safeRedirect);
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to initiate Google sign-in" };
}

export async function requestPasswordReset(formData: ForgotPasswordInput) {
  const validated = forgotPasswordSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email } = validated.data;

  const adminClient = createAdminClient();

  const { data: userData } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!userData) {
    return {
      success: true,
      message: "If an account exists, a reset email has been sent",
    };
  }

  const token = generateToken();
  const expiresAt = getExpiration(1);

  const { error: tokenError } = await adminClient
    .from("password_reset_tokens")
    .insert({
      user_id: userData.id,
      token,
      expires_at: expiresAt,
    });

  if (tokenError) {
    return {
      success: true,
      message: "If an account exists, a reset email has been sent",
    };
  }

  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
  try {
    await resend.emails.send({
      from: "CampusWhop <noreply@campuswhop.com>",
      to: email,
      subject: "Reset your CampusWhop password",
      html: passwordResetEmailTemplate(resetUrl),
    });
  } catch {
    // Silently fail to prevent enumeration
  }

  return {
    success: true,
    message: "If an account exists, a reset email has been sent",
  };
}

export async function resetPassword(formData: ResetPasswordInput) {
  const validated = resetPasswordSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { token, password } = validated.data;

  const adminClient = createAdminClient();

  const { data: tokenData, error: tokenError } = await adminClient
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return { error: "Invalid or expired token" };
  }

  if (tokenData.used_at) {
    return { error: "Token has already been used" };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { error: "Token has expired" };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    tokenData.user_id,
    { password }
  );

  if (updateError) {
    return { error: "Failed to reset password" };
  }

  await adminClient
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  return { success: true, message: "Password reset successfully" };
}

export async function completeOnboarding(formData: {
  fullName: string;
  university: string;
  matricNumber: string;
  phoneNumber?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: formData.fullName,
      university: formData.university,
      matric_number: formData.matricNumber,
      phone_number: formData.phoneNumber || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Failed to complete onboarding" };
  }

  revalidatePath("/dashboard");
  redirect("/onboarding/intent");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}