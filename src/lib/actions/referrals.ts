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
    .select("code")
    .eq("user_id", user.id)
    .single();
  
  if (!data) return { error: "No referral code found" };
  
  return { code: data.code };
}

export async function getMyReferrals() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", referrals: [] };
  
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
  };
}

export async function trackReferral(code: string, referredUserId: string) {
  const adminClient = createAdminClient();
  
  // Find referrer from code
  const { data: referralCode } = await adminClient
    .from("referral_codes")
    .select("user_id")
    .eq("code", code.toUpperCase())
    .single();
  
  if (!referralCode) return { error: "Invalid referral code" };
  
  // Don't let users refer themselves
  if (referralCode.user_id === referredUserId) return { error: "Cannot refer yourself" };
  
  // Check if already referred
  const { data: existing } = await adminClient
    .from("referrals")
    .select("id")
    .eq("referred_id", referredUserId)
    .single();
  
  if (existing) return { success: true }; // Already tracked
  
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
  
  // Check if buyer was referred
  const { data: referral } = await adminClient
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", buyerId)
    .eq("status", "pending")
    .single();
  
  if (!referral) return; // Not a referred user or already rewarded
  
  // 5% of order amount as reward
  const rewardAmount = Math.round(orderAmount * 0.05 * 100) / 100;
  
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