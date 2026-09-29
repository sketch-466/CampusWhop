"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmDelivery, disputeOrder, acceptOrder, markOrderDelivered } from "@/lib/actions/orders";
import { markStoreOrderShipped, confirmStoreDelivery } from "@/lib/actions/orders-store";
import MessageButton from "@/components/shared/message-button";
import { AlertTriangle, X } from "lucide-react";

const DISPUTE_REASONS = [
  { value: "item_not_received", label: "Item not received" },
  { value: "item_not_as_described", label: "Item not as described" },
  { value: "seller_unresponsive", label: "Seller is unresponsive" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "damaged_item", label: "Item arrived damaged" },
  { value: "other", label: "Other" },
]

function DisputeForm({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!reason) {
      setError("Please select a reason")
      return
    }
    if (description.trim().length < 20) {
      setError("Please provide at least 20 characters describing the issue")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await disputeOrder(orderId, reason, description.trim())
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-sm font-semibold text-red-400">Report a Problem</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Describe your issue clearly. Our team will review and respond.
      </p>

      {/* Reason */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">
          What went wrong?
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {DISPUTE_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                reason === r.value
                  ? "border-red-500/50 bg-red-900/20 text-red-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">
          Describe the issue
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain what happened in detail..."
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
        />
        <p className="text-[10px] text-zinc-600">
          {description.trim().length}/20 characters minimum
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Submitting..." : "Submit Dispute"}
        </button>
      </div>
    </div>
  )
}

export default function OrderActions({
  order,
  role,
}: {
  order: any;
  role: "buying" | "selling";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const isStoreOrder = !!order.store_product_id;
  const isDigital = !!order.digital_file_url;

  const showAcceptOrder =
    !isStoreOrder &&
    role === "selling" &&
    order.status === "paid";

  const showMarkDelivered =
    !isStoreOrder &&
    role === "selling" &&
    order.status === "accepted";

  const showMarketplaceConfirmDelivery =
    !isStoreOrder &&
    role === "buying" &&
    order.status === "shipped" &&
    order.listings?.product_type === "physical";

  const showDirectPayConfirm =
    !isStoreOrder &&
    role === "buying" &&
    order.status === "paid" &&
    order.listings?.product_type === "physical";

  const showDispute =
    !isStoreOrder &&
    role === "buying" &&
    ["paid", "accepted", "shipped"].includes(order.status);

  const showMarkShipped =
    isStoreOrder &&
    !isDigital &&
    role === "selling" &&
    order.status === "paid";

  const showStoreConfirmDelivery =
    isStoreOrder &&
    !isDigital &&
    role === "buying" &&
    order.status === "shipped";

  const showDownloadLink =
    isDigital &&
    role === "buying" &&
    order.status === "completed";

  const showMessageButton =
    !isStoreOrder &&
    ["paid", "accepted", "shipped"].includes(order.status);

  const hasActions =
    showAcceptOrder ||
    showMarkDelivered ||
    showMarketplaceConfirmDelivery ||
    showDirectPayConfirm ||
    showDispute ||
    showMarkShipped ||
    showStoreConfirmDelivery ||
    showDownloadLink ||
    showMessageButton ||
    order.status === "completed" ||
    order.status === "disputed" ||
    (isStoreOrder && order.status === "shipped" && role === "selling") ||
    (!isStoreOrder && order.status === "accepted" && role === "buying");

  if (!hasActions) return null;

  async function handleAction(action: string) {
    setLoadingAction(action);
    startTransition(async () => {
      try {
        if (action === "accept") {
          await acceptOrder(order.id);
        } else if (action === "deliver") {
          await markOrderDelivered(order.id);
        } else if (action === "confirm") {
          await confirmDelivery(order.id);
        } else if (action === "ship") {
          await markStoreOrderShipped(order.id);
        } else if (action === "store-confirm") {
          await confirmStoreDelivery(order.id);
        }
        router.refresh();
      } finally {
        setLoadingAction(null);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-3 py-2">

        {showAcceptOrder && (
          <button
            onClick={() => handleAction("accept")}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingAction === "accept" ? "Accepting..." : "✓ Accept Order"}
          </button>
        )}

        {showMarkDelivered && (
          <button
            onClick={() => handleAction("deliver")}
            disabled={isPending}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loadingAction === "deliver" ? "Updating..." : "📦 Mark as Delivered"}
          </button>
        )}

        {showMarketplaceConfirmDelivery && (
          <button
            onClick={() => handleAction("confirm")}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === "confirm" ? "Confirming..." : "✓ Confirm Delivery"}
          </button>
        )}

        {showDirectPayConfirm && (
          <button
            onClick={() => handleAction("confirm")}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === "confirm" ? "Confirming..." : "✓ Confirm Receipt"}
          </button>
        )}

        {!isStoreOrder && order.status === "accepted" && role === "buying" && (
          <span className="text-xs text-blue-400">
            ⏳ Seller is sourcing your order...
          </span>
        )}

        {showDispute && !showDisputeForm && (
          <button
            onClick={() => setShowDisputeForm(true)}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Report a Problem
          </button>
        )}

        {showMarkShipped && (
          <button
            onClick={() => handleAction("ship")}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingAction === "ship" ? "Updating..." : "📦 Mark as Shipped"}
          </button>
        )}

        {showStoreConfirmDelivery && (
          <button
            onClick={() => handleAction("store-confirm")}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === "store-confirm" ? "Confirming..." : "✓ Confirm Delivery"}
          </button>
        )}

        {showDownloadLink && (
          <a
            href={`/api/download/${order.id}`}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
          >
            ⬇ Download File
          </a>
        )}

        {showMessageButton && (
          <MessageButton
            otherUserId={role === "buying" ? order.seller_id : order.buyer_id}
            orderId={order.id}
            label={role === "buying" ? "Message Seller" : "Message Buyer"}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          />
        )}

        {order.status === "completed" && !showDownloadLink && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400">✓ Completed</span>
            {!isStoreOrder && (
              <Link
                href={`/reviews/${order.id}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
              >
                Leave Review
              </Link>
            )}
          </div>
        )}

        {order.status === "disputed" && (
          <span className="text-xs text-red-400">⚠ Under admin review</span>
        )}

        {order.status === "refunded" && (
          <span className="text-xs text-zinc-400">↩ Refunded</span>
        )}

        {isStoreOrder && order.status === "shipped" && role === "selling" && (
          <span className="text-xs text-zinc-500">
            Awaiting buyer confirmation...
          </span>
        )}

        {!isStoreOrder && order.status === "accepted" && role === "selling" && (
          <span className="text-xs text-zinc-500">
            Source the product and mark as delivered when ready.
          </span>
        )}
      </div>

      {/* Dispute Form — expands below actions */}
      {showDisputeForm && (
        <DisputeForm
          orderId={order.id}
          onClose={() => setShowDisputeForm(false)}
          onSuccess={() => {
            setShowDisputeForm(false)
            router.refresh()
          }}
        />
      )}
    </div>
  );
}