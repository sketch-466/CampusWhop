import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoinBundles, getWallet, verifyCoinPurchase } from "@/lib/actions/coins";
import CoinStore from "@/components/shared/coin-store";

export default async function CoinsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reference?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // Verify purchase if returning from Paystack
  let purchaseResult = null;
  if (params.status === "success" && params.reference) {
    purchaseResult = await verifyCoinPurchase(params.reference);
  }

  const [{ bundles }, { balance, totalEarned }] = await Promise.all([
    getCoinBundles(),
    getWallet(),
  ]);

  return (
    <CoinStore
      bundles={(bundles ?? []) as any}
      balance={balance ?? 0}
      purchaseResult={purchaseResult}
    />
  );
}