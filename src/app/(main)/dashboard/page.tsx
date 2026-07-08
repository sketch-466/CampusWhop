import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  ShoppingBag,
  Store,
  Home,
  GraduationCap,
  ArrowRight,
  Plus,
} from "lucide-react";
import { ReputationBadge } from "@/components/shared/reputation-badge";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const { data: subaccount } = await supabase
    .from("paystack_subaccounts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: reputationData } = await supabase
    .from("profiles")
    .select("reputation_score, total_reviews")
    .eq("id", user.id)
    .single();

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email ?? "U")[0].toUpperCase();

  const stats = [
    { label: "Listings", value: "0" },
    { label: "Orders", value: "0" },
    { label: "Earnings", value: "₦0" },
    { label: "Reputation", value: reputationData?.reputation_score?.toFixed(1) || "0" },
  ];

  const quickActions = [
    {
      icon: Briefcase,
      title: "Find Jobs",
      subtitle: "Browse campus jobs & gigs",
      href: "#",
      available: false,
    },
    {
      icon: ShoppingBag,
      title: "Browse Market",
      subtitle: "Buy & sell on campus",
      href: "/marketplace",
      available: true,
    },
    {
      icon: Store,
      title: "My Store",
      subtitle: "Launch your storefront",
      href: "#",
      available: false,
    },
    {
      icon: ShoppingBag,
      title: "My Listings",
      subtitle: "Manage your products",
      href: "/marketplace/my-listings",
      available: true,
    },
    {
      icon: Home,
      title: "Find Housing",
      subtitle: "Verified hostels near you",
      href: "#",
      available: false,
    },
    {
      icon: GraduationCap,
      title: "Opportunities",
      subtitle: "Scholarships & internships",
      href: "#",
      available: false,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">

      {/* Payout Setup Banner */}
      {!subaccount && (
        <div className="mb-4 rounded-lg border border-amber-800 bg-amber-900/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-400">
              Set up your payout account
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Required to receive payments when you sell
            </p>
          </div>
          <Link
            href="/seller/setup"
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            Set Up Now
          </Link>
        </div>
      )}

      {/* Profile Bar */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
            )}
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-white">
              {profile.full_name || "Student"}
            </h2>
            <p className="text-xs text-zinc-400">
              {profile.university || "No university"} · {profile.matric_number || "No matric"}
            </p>
            <div className="mt-0.5">
              <ReputationBadge
                score={profile.reputation_score || 0}
                totalReviews={profile.total_reviews || 0}
              />
            </div>
          </div>
        </div>
        <Link href="/profile/edit">
          <span className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800">
            Edit Profile
          </span>
        </Link>
      </div>

      {/* Sell Something CTA */}
      <div className="mt-4 rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-emerald-400">Start Selling</h3>
            <p className="text-sm text-emerald-300/70">
              List your first item and earn money on campus
            </p>
          </div>
          <Link href="/marketplace/new">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              Sell Something
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center"
          >
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-300">Quick Actions</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <action.icon className="h-6 w-6 text-emerald-500" />
              <h4 className="mt-2 text-sm font-medium text-white">
                {action.title}
              </h4>
              <p className="text-xs text-zinc-500">{action.subtitle}</p>
              {!action.available && (
                <span className="mt-1 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  Coming soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <p className="text-sm text-zinc-400">No activity yet.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Start by browsing the marketplace or posting your first listing.
        </p>
        <Link
          href="/marketplace"
          className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Browse Marketplace
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
