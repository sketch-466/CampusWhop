"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "@/lib/actions/orders";

const RESOLUTION_OPTIONS = [
  { value: "rejected", label: "Reject dispute — no action" },
  { value: "full_refund", label: "Full refund to buyer" },
  { value: "partial_refund", label: "Partial refund to buyer" },
  { value: "resolved_other", label: "Resolved by other means" },
];

export default function ResolveDisputeForm({
  disputeId,
  orderAmount,
}: {
  disputeId: string;
  orderAmount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [error, setError] = useState < string | null > (null);
  const [success, setSuccess] = useState(false);
  
  function handleSubmit() {
    if (!resolution) {
      setError("Please select a resolution");
      return;
    }
    if (notes.trim().length < 10) {
      setError("Please add resolution notes (minimum 10 characters)");
      return;
    }
    if (resolution === "partial_refund" && !refundAmount) {
      setError("Please enter the refund amount");
      return;
    }
    if (
      resolution === "partial_refund" &&
      parseFloat(refundAmount) > orderAmount
    ) {
      setError("Refund amount cannot exceed order amount");
      return;
    }
    
    setError(null);
    startTransition(async () => {
      const result = await resolveDispute(
        disputeId,
        resolution,
        notes.trim(),
        refundAmount ? parseFloat(refundAmount) : undefined
      );
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
          ✓ Dispute resolved successfully
        </p>
      </div>
    );
  }
  
  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-300">Resolve Dispute</p>

      {/* Resolution options */}
      <div className="space-y-1.5">
        {RESOLUTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setResolution(opt.value)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              resolution === opt.value
                ? "border-emerald-500/50 bg-emerald-900/20 text-emerald-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Partial refund amount */}
      {resolution === "partial_refund" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400">
            Refund amount (₦)
          </label>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder={`Max: ₦${orderAmount.toLocaleString()}`}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">
          Resolution notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Explain the resolution decision..."
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
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
        {isPending ? "Resolving..." : "Resolve Dispute"}
      </button>
    </div>
  );
}