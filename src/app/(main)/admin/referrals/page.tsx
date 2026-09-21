import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminGetAllReferralCodes, adminGetReferralStats } from "@/lib/actions/referrals";
import { AdminCreateCodeForm } from "@/components/admin/admin-create-code-form";
import { Users, Gift, Clock, TrendingUp } from "lucide-react";

export default async function AdminReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const [{ codes, error }, { total, rewarded, pending, totalCommissions }] =
  await Promise.all([
    adminGetAllReferralCodes(),
    adminGetReferralStats(),
  ]);
  
  if (error) redirect("/admin");
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">Referral System</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Manage referral codes and track ambassador performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Referrals", value: total, icon: Users, color: "text-zinc-400" },
          { label: "Converted", value: rewarded, icon: Gift, color: "text-emerald-400" },
          { label: "Pending", value: pending, icon: Clock, color: "text-amber-400" },
          { label: "Total Commissions", value: `₦${(totalCommissions ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Create custom code */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          Create Custom Code for Group Admin
        </h3>
        <AdminCreateCodeForm />
      </div>

      {/* All codes */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          All Referral Codes ({codes?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {(codes ?? []).map((code: any) => (
            <div
              key={code.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {code.code}
                    </span>
                    {code.is_custom && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        Custom
                      </span>
                    )}
                    {code.label && (
                      <span className="text-xs text-zinc-500">{code.label}</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {(code.owner as any)?.full_name ?? "Unknown"} ·{" "}
                    {(code.owner as any)?.email ?? ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">
                    {code.totalReferrals} referrals
                  </p>
                  <p className="text-xs text-emerald-400">
                    ₦{(code.totalEarned ?? 0).toLocaleString()} earned
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {Math.round((code.commission_rate ?? 0.05) * 100)}% commission
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-600 font-mono">
                  campuswhop.com/register?ref={code.code}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}