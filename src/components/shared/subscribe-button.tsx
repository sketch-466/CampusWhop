"use client";

import { useState, useTransition } from "react";
import { initiateSubscription } from "@/lib/actions/subscriptions";

export function SubscribeButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleSubscribe = () => {
    startTransition(async () => {
      const result = await initiateSubscription(planId);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSubscribe}
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Loading..." : "Subscribe · Monthly"}
      </button>
    </div>
  );
}