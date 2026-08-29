"use client";

import { useState, useTransition } from "react";
import { Coins, CheckCircle } from "lucide-react";
import { initializeCoinPurchase } from "@/lib/actions/coins";

interface Bundle {
  id: string;
  name: string;
  coins: number;
  price: number;
}

export default function CoinStore({
  bundles,
  balance,
  purchaseResult,
}: {
  bundles: Bundle[];
  balance: number;
  purchaseResult: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const handlePurchase = (bundleId: string) => {
    setLoadingBundle(bundleId);
    setError(undefined);
    startTransition(async () => {
      const result = await initializeCoinPurchase(bundleId);
      if (result.error) {
        setError(result.error);
        setLoadingBundle(null);
        return;
      }
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <h1 className="text-lg font-bold text-zinc-100">Coins</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Buy coins to unlock premium novel chapters
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Purchase success */}
        {purchaseResult?.success && !purchaseResult?.alreadyProcessed && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                Coins added successfully!
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                +{purchaseResult.coinsAdded} coins added to your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Wallet balance */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="h-6 w-6 text-amber-400" />
            <span className="text-4xl font-bold text-white">
              {balance.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-zinc-500">Your coin balance</p>
          <p className="text-xs text-zinc-600 mt-1">
            1 coin ≈ ₦2 worth of content
          </p>
        </div>

        {/* How coins work */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-white">How coins work</h2>
          <div className="space-y-1.5">
            {[
              "Buy a coin bundle below using Paystack",
              "Use coins to unlock premium chapters instantly",
              "Unlocks are permanent — pay once, read forever",
              "Authors earn 70% of every coin spent on their chapters",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-zinc-400">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bundles */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Choose a bundle</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            {bundles.map((bundle) => (
              <button
                key={bundle.id}
                onClick={() => handlePurchase(bundle.id)}
                disabled={isPending}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-left hover:border-emerald-500/50 hover:bg-zinc-900/60 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="text-lg font-bold text-white">
                    {bundle.coins}
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  {bundle.name}
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  ₦{bundle.price.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  ₦{(bundle.price / bundle.coins).toFixed(1)} per coin
                </p>
                {loadingBundle === bundle.id && (
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Redirecting...
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}