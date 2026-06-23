import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WalletDashboard } from "@/components/wallet/wallet-dashboard";

export default async function WalletPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("whopcoins_balance, reputation_score")
    .eq("id", user.id)
    .single();

  // Fetch transaction history
  const { data: transactions } = await supabase
    .from("reputation_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet & WhopCoins</h1>
        <p className="text-sm text-muted-foreground">
          Manage your campus currency and view earnings
        </p>
      </div>

      <WalletDashboard
        balance={profile?.whopcoins_balance || 0}
        reputation={profile?.reputation_score || 0}
        transactions={transactions || []}
      />
    </div>
  );
}
