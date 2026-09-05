import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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

  const adminClient = createAdminClient();
  const { data: plans } = await adminClient
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
    return sum + activeSubs * (p.price ?? 0);
  }, 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Subscriptions</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Platform-wide subscription plan overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: "Total Plans", value: totalPlans, color: "text-white" },
          { label: "Active Plans", value: activePlans, color: "text-emerald-400" },
          { label: "Subscribers", value: totalSubs, color: "text-white" },
          { label: "Monthly Revenue", value: `₦${totalMonthlyRevenue.toLocaleString()}`, color: "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {!plans || plans.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No subscription plans yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any) => {
            const creator = Array.isArray(plan.creator) ? plan.creator[0] : plan.creator
            const activeSubs = plan.subscriptions?.filter((s: any) => s.status === "active").length ?? 0
            const planTotal = plan.subscriptions?.length ?? 0

            return (
              <div key={plan.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{plan.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.is_active ? "bg-emerald-900/30 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{plan.description}</p>
                    )}
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      ₦{plan.price?.toLocaleString()}/month
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-zinc-400">
                        {creator?.full_name ?? "Unknown"} · {creator?.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {activeSubs} active · {planTotal} total subscriber{planTotal !== 1 ? 's' : ''}
                      </p>
                      {activeSubs > 0 && (
                        <p className="text-xs text-emerald-500">
                          ₦{(activeSubs * plan.price).toLocaleString()}/mo
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}