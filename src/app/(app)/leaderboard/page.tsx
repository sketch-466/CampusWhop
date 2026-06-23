import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTabs } from "@/components/leaderboard/leaderboard-tabs";
import { Trophy, Medal, Crown } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Top sellers by reputation
  const { data: topSellers } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, reputation_score, total_sales, university")
    .order("reputation_score", { ascending: false })
    .limit(50);

  // Top mediators
  const { data: topMediators } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, mediation_cases_won, mediation_fairness_score")
    .eq("is_mediator", true)
    .order("mediation_cases_won", { ascending: false })
    .limit(50);

  // Top WhopCoin holders
  const { data: topWhopcoins } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, whopcoins_balance, university")
    .order("whopcoins_balance", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Campus Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          The most active and trusted students on CampusWhop
        </p>
      </div>

      <LeaderboardTabs
        topSellers={topSellers || []}
        topMediators={topMediators || []}
        topWhopcoins={topWhopcoins || []}
        currentUserId={user.id}
      />
    </div>
  );
}
