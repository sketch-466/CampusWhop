"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const planSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().max(300).optional(),
  price: z.number().min(500, "Minimum price is ₦500"),
  perks: z.array(z.string().min(1)).max(10).optional(),
});

export async function createSubscriptionPlan(formData: {
  title: string;
  description: string;
  price: number;
  perks: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validated = planSchema.safeParse(formData);
  if (!validated.success) return { error: validated.error.errors[0].message };

  // Create plan on Paystack first
  const paystackRes = await fetch("https://api.paystack.co/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: validated.data.title,
      interval: "monthly",
      amount: validated.data.price * 100, // convert to kobo
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return { error: "Failed to create plan on Paystack" };
  }

  const { error } = await supabase.from("subscription_plans").insert({
    creator_id: user.id,
    title: validated.data.title,
    description: validated.data.description || null,
    price: validated.data.price,
    perks: validated.data.perks ?? [],
    paystack_plan_code: paystackData.data.plan_code,
    is_active: true,
  });

  if (error) return { error: "Failed to save plan" };

  revalidatePath("/subscriptions");
  return { success: true };
}

export async function deactivatePlan(planId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("creator_id", user.id);

  if (error) return { error: "Failed to deactivate plan" };

  revalidatePath("/subscriptions");
  return { success: true };
}

export async function initiateSubscription(planId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("paystack_plan_code, title, creator_id, price")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (!plan) return { error: "Plan not found or inactive" };
  if (plan.creator_id === user.id) return { error: "You cannot subscribe to your own plan" };

  // Check existing active subscription
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("plan_id", planId)
    .eq("subscriber_id", user.id)
    .eq("status", "active")
    .single();

  if (existing) return { error: "You already have an active subscription to this plan" };

  // Initialize Paystack transaction with plan code
  const reference = `cw_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: profile?.email ?? user.email,
      amount: plan.price * 100,
      plan: plan.paystack_plan_code,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscriptions?reference=${reference}`,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) return { error: "Failed to initialize payment" };

  return { url: paystackData.data.authorization_url };
}

export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("paystack_subscription_code, paystack_email_token")
    .eq("id", subscriptionId)
    .eq("subscriber_id", user.id)
    .single();

  if (!sub) return { error: "Subscription not found" };

  // Disable on Paystack
  const paystackRes = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: sub.paystack_subscription_code,
      token: sub.paystack_email_token,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) return { error: "Failed to cancel on Paystack" };

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId)
    .eq("subscriber_id", user.id);

  if (error) return { error: "Failed to update subscription status" };

  revalidatePath("/subscriptions");
  return { success: true };
}

export async function getMyPlans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("subscription_plans")
    .select("*, subscriptions(count)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getMySubscriptions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_plans(id, title, description, price, perks),
      creator:profiles!subscriptions_creator_id_fkey(id, full_name, avatar_url, creator_type)
    `)
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}