import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyReferralCode, getMyReferrals } from "@/lib/actions/referrals";
import ReferralDashboard from "@/components/shared/referral-dashboard";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ code }, { referrals, totalEarned, pendingEarnings }] =
    await Promise.all([getMyReferralCode(), getMyReferrals()]);

  return (
    <ReferralDashboard
      code={code ?? ""}
      referrals={(referrals ?? []) as any}
      totalEarned={totalEarned ?? 0}
      pendingEarnings={pendingEarnings ?? 0}
    />
  );
}