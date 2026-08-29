"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coins } from "lucide-react";
import { spendCoinsOnChapter } from "@/lib/actions/coins";
import { getWallet } from "@/lib/actions/coins";

export default function UnlockButton({
  chapterId,
  novelId,
  coinsRequired,
}: {
  chapterId: string;
  novelId: string;
  coinsRequired: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [balance, setBalance] = useState<number | null>(null);

  const handleUnlock = () => {
    setError(undefined);
    startTransition(async () => {
      // Fetch balance first to show user
      if (balance === null) {
        const wallet = await getWallet();
        setBalance(wallet.balance ?? 0);
      }

      const result = await spendCoinsOnChapter(chapterId, novelId);

      if (result.error) {
        if (result.insufficientCoins) {
          setError("Not enough coins. Buy more to continue reading.");
          return;
        }
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleUnlock}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        <Coins className="h-4 w-4" />
        {isPending ? "Unlocking..." : `Unlock for ${coinsRequired} coins`}
      </button>

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-400">{error}</p>
          <Link
            href="/coins"
            className="inline-block rounded-lg border border-emerald-500/30 px-4 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
          >
            Buy coins →
          </Link>
        </div>
      )}
    </div>
  );
}