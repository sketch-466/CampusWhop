"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackRequest } from "@/lib/paystack/client";
import { revalidatePath } from "next/cache";

// Coin to Naira conversion: 1 coin = ₦2
const COIN_TO_NAIRA = 2;
// Platform takes 30% of coin earnings, author gets 70%
const AUTHOR_SHARE = 0.7;

export async function getCoinBundles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coin_bundles")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) return { error: "Failed to fetch bundles", bundles: [] };
  return { bundles: data ?? [] };
}

export async function getWallet() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", balance: 0 };

  const { data } = await supabase
    .from("coin_wallets")
    .select("balance, total_earned")
    .eq("user_id", user.id)
    .single();

  return { balance: data?.balance ?? 0, totalEarned: data?.total_earned ?? 0 };
}

export async function initializeCoinPurchase(bundleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: bundle } = await supabase
    .from("coin_bundles")
    .select("*")
    .eq("id", bundleId)
    .eq("is_active", true)
    .single();

  if (!bundle) return { error: "Bundle not found" };

  const reference = `coins_${user.id}_${Date.now()}`;

  const result = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      amount: Math.round(bundle.price * 100),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/coins?status=success`,
      metadata: {
        type: "coin_purchase",
        bundle_id: bundleId,
        user_id: user.id,
        coins: bundle.coins,
      },
    }),
  });

  if (!result.status) return { error: result.message ?? "Failed to initialize payment" };

  return { success: true, authorizationUrl: result.data.authorization_url, reference };
}

export async function verifyCoinPurchase(reference: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if already processed
  const { data: existing } = await adminClient
    .from("coin_transactions")
    .select("id")
    .eq("reference", reference)
    .single();

  if (existing) return { success: true, alreadyProcessed: true };

  const result = await paystackRequest(`/transaction/verify/${reference}`);
  if (!result.status || result.data.status !== "success") {
    return { error: "Payment verification failed" };
  }

  const metadata = result.data.metadata;
  const coins = metadata.coins as number;

  // Credit wallet
  const { data: wallet } = await adminClient
    .from("coin_wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const newBalance = (wallet?.balance ?? 0) + coins;

  await adminClient
    .from("coin_wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  // Log transaction
  await adminClient.from("coin_transactions").insert({
    user_id: user.id,
    type: "purchase",
    amount: coins,
    balance_after: newBalance,
    description: `Purchased ${coins} coins`,
    reference,
  });

  revalidatePath("/coins");
  return { success: true, coinsAdded: coins, newBalance };
}

export async function spendCoinsOnChapter(chapterId: string, novelId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if already unlocked
  const { data: existingUnlock } = await supabase
    .from("chapter_unlocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .single();

  if (existingUnlock) return { success: true, alreadyUnlocked: true };

  // Get novel for coin cost
  const { data: novel } = await supabase
    .from("novels")
    .select("coins_per_chapter, author_id")
    .eq("id", novelId)
    .single();

  if (!novel) return { error: "Novel not found" };

  const coinsRequired = novel.coins_per_chapter;

  // Check wallet balance
  const { data: wallet } = await adminClient
    .from("coin_wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (!wallet || wallet.balance < coinsRequired) {
    return { error: "Insufficient coins", insufficientCoins: true };
  }

  const newBalance = wallet.balance - coinsRequired;

  // Deduct coins
  await adminClient
    .from("coin_wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  // Log spend transaction
  await adminClient.from("coin_transactions").insert({
    user_id: user.id,
    type: "spend",
    amount: -coinsRequired,
    balance_after: newBalance,
    description: `Unlocked chapter`,
    reference: `unlock_${chapterId}`,
  });

  // Record unlock
  await adminClient.from("chapter_unlocks").insert({
    user_id: user.id,
    chapter_id: chapterId,
    novel_id: novelId,
    coins_spent: coinsRequired,
  });

  // Credit author earnings
  const nairaValue = coinsRequired * COIN_TO_NAIRA * AUTHOR_SHARE;
  await adminClient.from("author_coin_earnings").insert({
    author_id: novel.author_id,
    chapter_id: chapterId,
    reader_id: user.id,
    coins_earned: Math.floor(coinsRequired * AUTHOR_SHARE),
    naira_value: nairaValue,
  });

  revalidatePath("/coins");
  return { success: true, newBalance };
}