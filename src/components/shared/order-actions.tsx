"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmDelivery, disputeOrder } from "@/lib/actions/orders";
import { markStoreOrderShipped, confirmStoreDelivery } from "@/lib/actions/orders-store";

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

  const isStoreOrder = !!order.store_product_id;
  const isDigital = !!order.digital_file_url;

  const showMarketplaceConfirmDelivery =
    !isStoreOrder &&
    role === "buying" &&
    order.status === "paid" &&
    order.listings?.product_type === "physical";

  const showDispute =
    !isStoreOrder &&
    role === "buying" &&
    order.status === "paid";

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

  const hasActions =
    showMarketplaceConfirmDelivery ||
    showDispute ||
    showMarkShipped ||
    showStoreConfirmDelivery ||
    showDownloadLink ||
    order.status === "completed" ||
    order.status === "disputed" ||
    (isStoreOrder && order.status === "shipped" && role === "selling");

  if (!hasActions) return null;

  async function handleAction(action: string) {
    setLoadingAction(action);
    startTransition(async () => {
      try {
        if (action === "confirm") {
          await confirmDelivery(order.id);
        } else if (action === "dispute") {
          await disputeOrder(order.id, "Buyer initiated dispute");
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
    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-3 py-2">
      {showMarketplaceConfirmDelivery && (
        <button
          onClick={() => handleAction("confirm")}
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loadingAction === "confirm" ? "Confirming..." : "✓ Confirm Delivery"}
        </button>
      )}

      {showDispute && (
        <button
          onClick={() => handleAction("dispute")}
          disabled={isPending}
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {loadingAction === "dispute" ? "Processing..." : "Dispute"}
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

      {isStoreOrder && order.status === "shipped" && role === "selling" && (
        <span className="text-xs text-zinc-500">
          Awaiting buyer confirmation...
        </span>
      )}
    </div>
  );
}