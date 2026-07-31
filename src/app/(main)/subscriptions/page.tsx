import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2 } from "lucide-react";
import { getMyPlans, getMySubscriptions } from "@/lib/actions/subscriptions";
import { SubscriptionActions } from "@/components/shared/subscription-actions";
import { CREATOR_TYPE_LABELS, type CreatorType } from "@/lib/validations/profile";

type PageProps = {
  searchParams: Promise<{ tab?: string; reference?: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  expired: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "non-renewing": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab === "plans" ? "plans" : "subscriptions";

  const [myPlans, mySubscriptions] = await Promise.all([
    getMyPlans(),
    getMySubscriptions(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your plans and active subscriptions
          </p>
        </div>
        <Link href="/subscriptions/plans/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </Link>
      </div>

      {params.reference && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">
            ✓ Subscription activated successfully.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-800 p-1">
        <Link
          href="/subscriptions?tab=subscriptions"
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
            tab === "subscriptions"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          My Subscriptions ({mySubscriptions.length})
        </Link>
        <Link
          href="/subscriptions?tab=plans"
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
            tab === "plans"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          My Plans ({myPlans.length})
        </Link>
      </div>

      {/* My Subscriptions */}
      {tab === "subscriptions" && (
        <div className="space-y-4">
          {mySubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
              <p className="text-sm text-zinc-400">No active subscriptions.</p>
              <Link href="/creators" className="mt-2 text-xs text-emerald-400 hover:underline">
                Browse creators
              </Link>
            </div>
          ) : (
            mySubscriptions.map((sub: any) => {
              const creator = sub.creator;
              const plan = sub.subscription_plans;
              const initials = creator?.full_name
                ? creator.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                : "?";

              return (
                <div key={sub.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        {creator?.avatar_url && (
                          <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{plan?.title}</p>
                        <Link
                          href={`/creators/${creator?.id}`}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          {creator?.full_name}
                          {creator?.creator_type && (
                            <span className="ml-1 text-zinc-500">
                              · {CREATOR_TYPE_LABELS[creator.creator_type as CreatorType]}
                            </span>
                          )}
                        </Link>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[sub.status] ?? STATUS_STYLES.expired}`}>
                      {sub.status}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-emerald-400">
                    ₦{plan?.price?.toLocaleString()}/month
                  </p>

                  {plan?.perks?.length > 0 && (
                    <ul className="space-y-1">
                      {plan.perks.map((perk: string) => (
                        <li key={perk} className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}

                  {sub.current_period_end && (
                    <p className="text-xs text-zinc-500">
                      Renews {new Date(sub.current_period_end).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  {sub.status === "active" && (
                    <SubscriptionActions subscriptionId={sub.id} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Plans */}
      {tab === "plans" && (
        <div className="space-y-4">
          {myPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
              <p className="text-sm text-zinc-400">You haven&apos;t created any plans yet.</p>
              <Link href="/subscriptions/plans/new" className="mt-2 text-xs text-emerald-400 hover:underline">
                Create your first plan
              </Link>
            </div>
          ) : (
            myPlans.map((plan: any) => (
              <div key={plan.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{plan.title}</p>
                    {plan.description && (
                      <p className="mt-0.5 text-xs text-zinc-400">{plan.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${plan.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-sm font-bold text-emerald-400">
                  ₦{plan.price?.toLocaleString()}/month
                </p>

                {plan.perks?.length > 0 && (
                  <ul className="space-y-1">
                    {plan.perks.map((perk: string) => (
                      <li key={perk} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500">
                    {plan.subscriptions?.[0]?.count ?? 0} subscriber(s)
                  </p>
                  {plan.is_active && (
                    <SubscriptionActions planId={plan.id} isCreator />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}