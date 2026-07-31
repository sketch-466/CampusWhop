"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscription, deactivatePlan, initiateSubscription } from "@/lib/actions/subscriptions";

interface SubscriptionActionsProps {
  subscriptionId?: string;
  planId?: string;
  isCreator?: boolean;
}

export function SubscriptionActions({
  subscriptionId,
  planId,
  isCreator = false,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleCancel = () => {
    if (!subscriptionId) return;
    if (!confirm("Cancel this subscription? You'll keep access until the end of the billing period.")) return;

    startTransition(async () => {
      const result = await cancelSubscription(subscriptionId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const handleDeactivate = () => {
    if (!planId) return;
    if (!confirm("Deactivate this plan? Existing subscribers won't be charged on renewal.")) return;

    startTransition(async () => {
      const result = await deactivatePlan(planId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {isCreator ? (
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="self-start rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isPending ? "Deactivating..." : "Deactivate Plan"}
        </button>
      ) : (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="self-start rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Cancel Subscription"}
        </button>
      )}
    </div>
  );
}