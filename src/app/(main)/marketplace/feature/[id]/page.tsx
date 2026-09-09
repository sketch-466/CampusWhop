"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PLANS = [
  { days: 3, label: "3 Days", subtitle: "Quick boost", price: 500, kobo: 50000 },
  { days: 7, label: "7 Days", subtitle: "Most popular", price: 1000, kobo: 100000, popular: true },
  { days: 14, label: "14 Days", subtitle: "Best value", price: 1800, kobo: 180000 },
  { days: 30, label: "30 Days", subtitle: "Maximum exposure", price: 3000, kobo: 300000 },
];

interface Product {
  id: string;
  title: string;
  is_featured: boolean;
  featured_until: string | null;
  user_id: string;
}

export default function FeaturePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const type = searchParams.get("type") || "listing"; // "listing" | "product"

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");

      const table = type === "product" ? "store_products" : "listings";
      const titleCol = type === "product" ? "name" : "title";

      const { data, error: fetchError } = await supabase
        .from(table)
        .select(`id, ${titleCol}, is_featured, featured_until, user_id`)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("Listing not found or you don't have permission to feature it.");
        setLoading(false);
        return;
      }

      setProduct({
        id: data.id,
        title: data[titleCol as keyof typeof data] as string,
        is_featured: data.is_featured,
        featured_until: data.featured_until,
        user_id: data.user_id,
      });
      setLoading(false);
    }
    load();
  }, [id, type, router]);

  function initializePaystack(plan: typeof PLANS[0]) {
    if (paying) return;
    setPaying(true);

    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: userEmail,
      amount: plan.kobo,
      currency: "NGN",
      ref: `feature_${id}_${plan.days}_${Date.now()}`,
      metadata: {
        product_id: id,
        product_type: type,
        days: plan.days,
      },
      callback: async (response: { reference: string }) => {
        try {
          const res = await fetch("/api/feature/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              product_id: id,
              product_type: type,
              days: plan.days,
            }),
          });
          const result = await res.json();
          if (result.success) {
            setSuccess(true);
          } else {
            setError(result.error || "Payment verified but activation failed. Contact support.");
          }
        } catch {
          setError("Something went wrong after payment. Contact support with your reference: " + response.reference);
        } finally {
          setPaying(false);
        }
      },
      onClose: () => {
        setPaying(false);
      },
    });

    handler.openIframe();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-emerald-400 underline text-sm">Go back</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Featured!</h1>
          <p className="text-zinc-400 mb-6 text-sm">
            <span className="text-white font-medium">{product?.title}</span> is now pinned to the top of the marketplace and shown on the homepage.
          </p>
          <button
            onClick={() => router.push("/marketplace")}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition"
          >
            View Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyFeatured =
    product?.is_featured &&
    product?.featured_until &&
    new Date(product.featured_until) > new Date();

  return (
    <>
      <script src="https://js.paystack.co/v1/inline.js" async />
      <div className="min-h-screen bg-[#0A0F0D] text-white">
        <div className="max-w-lg mx-auto px-4 py-8">

          {/* Header */}
          <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-6 flex items-center gap-1 hover:text-zinc-300 transition">
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-white mb-1">Feature this Listing</h1>
          <p className="text-zinc-400 text-sm mb-6 truncate">{product?.title}</p>

          {/* Already featured banner */}
          {isAlreadyFeatured && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <p className="text-amber-400 text-sm font-medium">⭐ Currently featured</p>
              <p className="text-zinc-400 text-xs mt-1">
                Expires {new Date(product!.featured_until!).toLocaleDateString("en-NG", { dateStyle: "medium" })}. Purchasing a new plan will extend from that date.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">What Featuring Does</p>
            {[
              "Pinned to the top of all marketplace searches",
              "Shown in the Featured section on the homepage",
              "Gold ⭐ Featured badge on your listing card",
              "More visibility = more buyers",
            ].map((b) => (
              <div key={b} className="flex items-start gap-2 mb-2">
                <span className="text-amber-400 text-sm">⚡</span>
                <span className="text-zinc-300 text-sm">{b}</span>
              </div>
            ))}
          </div>

          {/* Plans */}
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Choose a Duration</p>
          <div className="space-y-3 mb-8">
            {PLANS.map((plan) => (
              <button
                key={plan.days}
                onClick={() => setSelectedPlan(plan.days)}
                className={`w-full rounded-xl p-4 border text-left transition relative ${
                  selectedPlan === plan.days
                    ? "border-emerald-500 bg-emerald-500/10"
                    : plan.popular
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{plan.label}</p>
                    <p className="text-zinc-500 text-sm">{plan.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">₦{plan.price.toLocaleString()}</p>
                    {selectedPlan === plan.days && (
                      <p className="text-emerald-500 text-xs">Selected ✓</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            disabled={!selectedPlan || paying}
            onClick={() => {
              const plan = PLANS.find((p) => p.days === selectedPlan);
              if (plan) initializePaystack(plan);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition text-base"
          >
            {paying
              ? "Opening payment..."
              : selectedPlan
              ? `Feature for ₦${PLANS.find((p) => p.days === selectedPlan)?.price.toLocaleString()}`
              : "Select a plan to continue"}
          </button>

          <p className="text-center text-zinc-600 text-xs mt-4">
            Secured by Paystack · Instant activation on payment
          </p>
        </div>
      </div>
    </>
  );
}