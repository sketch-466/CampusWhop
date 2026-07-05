"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initializeOrder } from "@/lib/actions/orders";

export function BuyButton({ listingId, price }: { listingId: string; price: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600"
      >
        {loading ? "Processing..." : `Buy Now — ₦${price.toLocaleString()}`}
      </Button>
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}