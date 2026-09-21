"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getMyReferralCode() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data } = await adminClient
    .from("referral_codes")
    .select("code, label, commission_rate")
    .eq("user_id", user.id)
    .single();

  if (!data) return { error: "No referral code found" };

  return { code: data.code, label: data.label, commissionRate: data.commission_rate };
}

export async function getMyReferrals() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", referrals: [] };

  const { data: codeData } = await adminClient
    .from("referral_codes")
    .select("commission_rate")
    .eq("user_id", user.id)
    .single();

  const commissionRate = codeData?.commission_rate ?? 0.05;

  const { data } = await adminClient
    .from("referrals")
    .select(`
      id,
      status,
      reward_amount,
      created_at,
      rewarded_at,
      referred:profiles!referrals_referred_id_fkey(full_name, avatar_url)
    `)
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const totalEarned = (data ?? [])
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

  const pendingEarnings = (data ?? [])
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

  return {
    referrals: data ?? [],
    totalEarned,
    pendingEarnings,
    commissionRate,
  };
}

export async function trackReferral(code: string, referredUserId: string) {
  const adminClient = createAdminClient();

  const { data: referralCode } = await adminClient
    .from("referral_codes")
    .select("user_id, commission_rate")
    .eq("code", code.toUpperCase())
    .single();

  if (!referralCode) return { error: "Invalid referral code" };
  if (referralCode.user_id === referredUserId) return { error: "Cannot refer yourself" };

  const { data: existing } = await adminClient
    .from("referrals")
    .select("id")
    .eq("referred_id", referredUserId)
    .single();

  if (existing) return { success: true };

  await adminClient.from("referrals").insert({
    referrer_id: referralCode.user_id,
    referred_id: referredUserId,
    code: code.toUpperCase(),
    status: "pending",
  });

  return { success: true };
}

export async function processReferralReward(
  orderId: string,
  buyerId: string,
  orderAmount: number
) {
  const adminClient = createAdminClient();

  const { data: referral } = await adminClient
    .from("referrals")
    .select("id, referrer_id, status, code")
    .eq("referred_id", buyerId)
    .eq("status", "pending")
    .single();

  if (!referral) return;

  // Get commission rate for this referrer's code
  const { data: codeData } = await adminClient
    .from("referral_codes")
    .select("commission_rate")
    .eq("code", referral.code)
    .single();

  const commissionRate = codeData?.commission_rate ?? 0.05;
  const rewardAmount = Math.round(orderAmount * commissionRate * 100) / 100;

  await adminClient
    .from("referrals")
    .update({
      status: "rewarded",
      reward_amount: rewardAmount,
      order_id: orderId,
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  revalidatePath("/referrals");
}

// ── ADMIN FUNCTIONS ──

export async function adminGetAllReferralCodes() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Unauthorized" };

  const { data, error } = await adminClient
    .from("referral_codes")
    .select(`
      id,
      code,
      label,
      commission_rate,
      is_custom,
      created_at,
      user_id,
      owner:profiles!referral_codes_user_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  // Get referral counts and earnings per code
  const codesWithStats = await Promise.all(
    (data ?? []).map(async (code) => {
      const { data: referrals } = await adminClient
        .from("referrals")
        .select("status, reward_amount")
        .eq("code", code.code);

      const totalReferrals = referrals?.length ?? 0;
      const totalEarned = (referrals ?? [])
        .filter((r) => r.status === "rewarded")
        .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

      return { ...code, totalReferrals, totalEarned };
    })
  );

  return { codes: codesWithStats };
}

export async function adminCreateCustomCode(formData: {
  userId: string;
  code: string;
  label: string;
  commissionRate: number;
}) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Unauthorized" };

  // Validate code format
  const cleanCode = formData.code.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  if (cleanCode.length < 3) return { error: "Code must be at least 3 characters" };
  if (cleanCode.length > 20) return { error: "Code must be 20 characters or less" };

  // Check if code already exists
  const { data: existing } = await adminClient
    .from("referral_codes")
    .select("id")
    .eq("code", cleanCode)
    .single();

  if (existing) return { error: "This code already exists" };

  const { error } = await adminClient
    .from("referral_codes")
    .insert({
      user_id: formData.userId,
      code: cleanCode,
      label: formData.label,
      commission_rate: formData.commissionRate / 100,
      is_custom: true,
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/referrals");
  return { success: true, code: cleanCode };
}

export async function adminUpdateCommissionRate(
  codeId: string,
  commissionRate: number
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Unauthorized" };

  const { error } = await adminClient
    .from("referral_codes")
    .update({ commission_rate: commissionRate / 100 })
    .eq("id", codeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/referrals");
  return { success: true };
}

export async function adminGetReferralStats() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Unauthorized" };

  const { data: allReferrals } = await adminClient
    .from("referrals")
    .select("status, reward_amount, created_at");

  const total = allReferrals?.length ?? 0;
  const rewarded = allReferrals?.filter((r) => r.status === "rewarded").length ?? 0;
  const pending = allReferrals?.filter((r) => r.status === "pending").length ?? 0;
  const totalCommissions = (allReferrals ?? [])
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + (r.reward_amount ?? 0), 0);

  return { total, rewarded, pending, totalCommissions };
}