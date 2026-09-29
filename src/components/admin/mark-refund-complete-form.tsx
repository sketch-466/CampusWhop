"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRefundComplete } from "@/lib/actions/orders";

export default function MarkRefundCompleteForm({
  orderId,
  refundAmount,
}: {
  orderId: string;
  refundAmount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reference, setReference] = useState("");
  const [error, setError] = useState < string | null > (null);
  const [success, setSuccess] = useState(false);
  
  function handleSubmit() {
    if (!reference.trim()) {
      setError("Please enter the Paystack refund reference");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await markRefundComplete(orderId, reference.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }
  
  if (success) {
    return (
      <div className="border-t border-zinc-800 bg-emerald-900/10 px-4 py-3">
        <p className="text-xs text-emerald-400 font-medium">
          ✓ Refund marked as complete
        </p>
      </div>
    );
  }
  
  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-zinc-300">
          Mark Refund Complete
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Process ₦{refundAmount?.toLocaleString()} via Paystack dashboard first,
          then enter the reference below.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">
          Paystack refund reference
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. re_xxxxxxxxxxxxxxxxxx"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none font-mono"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving..." : "Confirm Refund Complete"}
      </button>
    </div>
  );
}