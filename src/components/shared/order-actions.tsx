"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmDelivery, disputeOrder, acceptOrder, markOrderDelivered } from "@/lib/actions/orders";
import { markStoreOrderShipped, confirmStoreDelivery } from "@/lib/actions/orders-store";
import MessageButton from "@/components/shared/message-button";

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
  );
}