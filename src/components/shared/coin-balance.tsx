"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { getWallet } from "@/lib/actions/coins";

export default function CoinBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      const { balance } = await getWallet();
      setBalance(balance ?? 0);
    }
    fetchBalance();
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href="/coins"
      className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-amber-400 hover:border-zinc-600 transition-colors"
    >
      <Coins className="h-3.5 w-3.5" />
      {balance.toLocaleString()}
    </Link>
  );
}