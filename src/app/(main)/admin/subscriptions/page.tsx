import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select(`
      *,
      creator:profiles!subscription_plans_creator_id_fkey(full_name, email),
      subscriptions(id, status)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const totalPlans = plans?.length ?? 0;
  const activePlans = plans?.filter((p) => p.is_active).length ?? 0;
  const totalSubs = plans?.reduce((sum, p) =>
    sum + (p.subscriptions?.filter((s: any) => s.status === "active").length ?? 0), 0) ?? 0;
  const totalMonthlyRevenue = plans?.reduce((sum, p) => {
    const activeSubs = p.subscriptions?.filter((s: any) => s.status === "active").length ?? 0;
    return sum + activeSubs * (p.price ?? 0)
  }, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Platform subscriptions overview</p>

      {/* Admin Navigation */}
      <div className="flex flex-wrap gap-3 mt-6 border-b border-zinc-800 pb-4">
        <Link href="/admin/listings"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Listings
        </Link>
        <Link href="/admin/jobs"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Gigs
        </Link>
        <Link href="/admin/stores"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Stores
        </Link>
        <Link href="/admin/disputes"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Disputes
        </Link>
        <Link href="/admin/bookings"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Bookings
        </Link>
        <Link href="/admin/subscriptions"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
          Subscriptions
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{totalPlans}</p>
          <p className="text-xs text-zinc-500">Total Plans</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">{activePlans}</p>
          <p className="text-xs text-zinc-500">Active Plans</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{totalSubs}</p>
          <p className="text-xs text-zinc-500">Subscribers</p>
        </div>
        <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">
            ₦{totalMonthlyRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Monthly Revenue</p>
        </div>
      </div>

      <div className="mt-6">
        {!plans || plans.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-400">No subscription plans yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan: any) => {
              const creator = Array.isArray(plan.creator)
                ? plan.creator[0] : plan.creator
              const activeSubs = plan.subscriptions?.filter(
                (s: any) => s.status === "active"
              ).length ?? 0
              const totalSubs = plan.subscriptions?.length ?? 0

              return (
                <div key={plan.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{plan.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          plan.is_active
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{plan.description}</p>
                      )}
                      <p className="text-sm font-bold text-emerald-400 mt-1">
                        ₦{plan.price?.toLocaleString()}/month
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-zinc-400">
                          Creator: {creator?.full_name ?? "Unknown"} · {creator?.email}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {activeSubs} active · {totalSubs} total subscriber(s)
                        </p>
                        {activeSubs > 0 && (
                          <p className="text-xs text-emerald-500">
                            ₦{(activeSubs * plan.price).toLocaleString()}/mo platform flow
                          </p>
                        )}
                        <p className="text-xs text-zinc-600">
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}