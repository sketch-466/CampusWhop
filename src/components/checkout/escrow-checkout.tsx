"use client";

import { useState } from "react";
import { Shield, Lock, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface EscrowCheckoutProps {
  product: {
    id: string;
    title: string;
    price: number;
    image_url?: string;
    seller_id: string;
    seller_name: string;
    condition: string;
  };
  buyerId: string;
  onSuccess?: () => void;
}

export function EscrowCheckout({ product, buyerId, onSuccess }: EscrowCheckoutProps) {
  const [step, setStep] = useState<"review" | "confirm" | "processing" | "success">("review");
  const [useWhopCoins, setUseWhopCoins] = useState(false);
  const [whopCoinsAmount, setWhopCoinsAmount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const supabase = createClient();

  const WHOPCOIN_RATE = 10; // 1 WhopCoin = ₦10
  const maxWhopCoins = Math.min(
    Math.floor(product.price / WHOPCOIN_RATE),
    500 // max discount
  );

  const discount = whopCoinsAmount * WHOPCOIN_RATE;
  const finalPrice = product.price - discount;

  const handleConfirm = async () => {
    setStep("processing");

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          seller_id: product.seller_id,
          product_id: product.id,
          amount: product.price,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create escrow transaction
      const { error: escrowError } = await supabase
        .from("escrow_transactions")
        .insert({
          order_id: order.id,
          buyer_id: buyerId,
          seller_id: product.seller_id,
          amount: finalPrice,
          status: "held",
        });

      if (escrowError) throw escrowError;

      // Deduct WhopCoins if used
      if (whopCoinsAmount > 0) {
        await supabase.rpc("deduct_whopcoins", {
          user_id: buyerId,
          amount: whopCoinsAmount,
        });
      }

      // Add reputation event
      await supabase.from("reputation_events").insert({
        user_id: buyerId,
        event_type: "purchase_made",
        points: 5,
        metadata: { order_id: order.id, amount: finalPrice },
      });

      setStep("success");
      onSuccess?.();
    } catch (error) {
      console.error("Checkout failed:", error);
      setStep("review");
    }
  };

  if (step === "success") {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Payment Secured in Escrow
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            ₦{finalPrice.toLocaleString()} is now held safely. The seller will be
            notified to ship your item.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Auto-release in 48 hours if no dispute
            </p>
            <p className="flex items-center justify-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Funds are protected until you confirm delivery
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Product Summary */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-20 h-20 rounded-lg object-cover bg-muted"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">{product.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sold by {product.seller_name}
              </p>
              <p className="text-xs text-muted-foreground">Condition: {product.condition}</p>
              <p className="text-lg font-bold text-emerald-400 mt-2">
                ₦{product.price.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escrow Info */}
      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-400">
              Campus Escrow Protection
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Your payment is held securely until you confirm receipt. If there's an
              issue, you can raise a dispute within 48 hours.
            </p>
          </div>
        </div>
      </div>

      {/* WhopCoins */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-emerald-400">⚡</span>
            Use WhopCoins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Available balance</span>
            <span className="text-sm font-medium text-emerald-400">1,250 WhopCoins</span>
          </div>
          {useWhopCoins && (
            <div className="space-y-3">
              <input
                type="range"
                min={0}
                max={maxWhopCoins}
                value={whopCoinsAmount}
                onChange={(e) => setWhopCoinsAmount(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">0</span>
                <span className="text-emerald-400 font-medium">
                  {whopCoinsAmount} WhopCoins = ₦{discount.toLocaleString()} off
                </span>
                <span className="text-muted-foreground">{maxWhopCoins}</span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "mt-2 w-full",
              useWhopCoins
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                : "border-border"
            )}
            onClick={() => {
              setUseWhopCoins(!useWhopCoins);
              if (!useWhopCoins) setWhopCoinsAmount(Math.min(100, maxWhopCoins));
              else setWhopCoinsAmount(0);
            }}
          >
            {useWhopCoins ? "Remove WhopCoins" : "Apply WhopCoins"}
          </Button>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <div className="rounded-lg bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Item price</span>
          <span className="text-foreground">₦{product.price.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-400">WhopCoins discount</span>
            <span className="text-emerald-400">-₦{discount.toLocaleString()}</span>
          </div>
        )}
        <Separator className="bg-border" />
        <div className="flex justify-between text-base font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-emerald-400">₦{finalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          className={cn(
            "w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5",
            agreedToTerms
              ? "bg-emerald-600 border-emerald-600"
              : "border-border group-hover:border-emerald-500/50"
          )}
          onClick={() => setAgreedToTerms(!agreedToTerms)}
        >
          {agreedToTerms && <CheckCircle className="h-3.5 w-3.5 text-white" />}
        </div>
        <span className="text-xs text-muted-foreground">
          I agree to the escrow terms. I understand funds are held for 48 hours and
          I must confirm delivery or raise a dispute within that window.
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 border-border hover:bg-muted">
          Cancel
        </Button>
        <Button
          className="flex-1 bg-emerald-600 hover:bg-emerald-500"
          disabled={!agreedToTerms || step === "processing"}
          onClick={handleConfirm}
        >
          {step === "processing" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Securing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay ₦{finalPrice.toLocaleString()}
            </>
          )}
        </Button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <Lock className="h-3 w-3" />
        <span>256-bit encrypted · CampusWhop Escrow</span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
