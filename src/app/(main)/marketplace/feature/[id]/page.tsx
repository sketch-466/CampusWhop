import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Zap } from "lucide-react";

const FEATURE_PLANS = [
  { days: 3, price: 500, label: "3 Days", description: "Quick boost" },
  { days: 7, price: 1000, label: "7 Days", description: "Most popular", highlight: true },
  { days: 14, price: 1800, label: "14 Days", description: "Best value" },
  { days: 30, price: 3000, label: "30 Days", description: "Maximum exposure" },
];

export default async function FeatureListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, price, images, status, is_featured, seller_id")
    .eq("id", id)
    .single();

  if (!listing || listing.seller_id !== user.id) redirect("/marketplace/my-listings");
  if (listing.status !== "active") redirect("/marketplace/my-listings");
  if (listing.is_featured) redirect("/marketplace/my-listings");

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link
        href="/marketplace/my-listings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Listings
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          <h1 className="text-xl font-bold text-white">Feature This Listing</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Featured listings appear at the top of the marketplace and in the featured section on the homepage.
        </p>
      </div>

      {/* Listing preview */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-zinc-900">
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">No image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{listing.title}</p>
          <p className="text-sm text-emerald-400">₦{listing.price.toLocaleString()}</p>
        </div>
      </div>

      {/* What you get */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">What featuring does</p>
        {[
          "Pinned to the top of all marketplace searches",
          "Shown in the Featured section on the homepage",
          "Gold ⭐ Featured badge on your listing card",
          "More visibility = more buyers",
        ].map((benefit) => (
          <div key={benefit} className="flex items-start gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300">{benefit}</p>
          </div>
        ))}
      </div>

      {/* Pricing plans — each is its own form */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Choose a duration</p>
        {FEATURE_PLANS.map((plan) => (
          <div
            key={plan.days}
            className={`relative rounded-xl border p-4 ${
              plan.highlight
                ? "border-amber-500/50 bg-amber-900/10"
                : "border-zinc-800 bg-zinc-900/30"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-2 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{plan.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-400">₦{plan.price.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Coming soon</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Paid featuring is coming soon. Contact us on WhatsApp to feature your listing manually.
      </p>

      <div className="mt-4 text-center">
        <a
          href="https://wa.me/+2348000000000"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}