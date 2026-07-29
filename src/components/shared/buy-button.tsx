"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initializeOrder } from "@/lib/actions/orders";

export function BuyButton({
  listingId,
  price,
  paymentType = "escrow",
}: {
  listingId: string;
  price: number;
  paymentType?: "escrow" | "direct";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  async function handleBuy() {
    setLoading(true);
    setError(null);

    const result = await initializeOrder(listingId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.authorizationUrl) {
      window.location.href = result.authorizationUrl;
    }
  }

  if (paymentType === "direct" && showWarning === false) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-3">
          <p className="text-xs font-semibold text-amber-400 mb-1">
            ⚡ Direct Payment Listing
          </p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Payment goes directly to the seller upon purchase. This listing is
            not covered by escrow — CampusWhop cannot guarantee refunds if the
            seller fails to deliver. Only buy from sellers you trust.
          </p>
        </div>
        <Button
          onClick={() => setShowWarning(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          I Understand — Buy Now ₦{price.toLocaleString()}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paymentType === "direct" && (
        <p className="text-xs text-amber-400 text-center">
          ⚡ Direct payment — no escrow protection
        </p>
      )}
      <Button
        onClick={handleBuy}
        disabled={loading}
        className={`w-full ${
          paymentType === "direct"
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {loading ? "Processing..." : `Buy Now — ₦${price.toLocaleString()}`}
      </Button>
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}