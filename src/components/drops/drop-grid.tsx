"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Clock, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface DropsGridProps {
  drops: any[];
  isActive: boolean;
}

export function DropsGrid({ drops, isActive }: DropsGridProps) {
  if (drops.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-xl">
        <Flame className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No {isActive ? "active" : "upcoming"} drops</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {drops.map((drop) => (
        <DropCard key={drop.id} drop={drop} isActive={isActive} />
      ))}
    </div>
  );
}

function DropCard({ drop, isActive }: { drop: any; isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isActive) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const dropTime = new Date(drop.drop_time).getTime();
        const diff = dropTime - now;

        if (diff <= 0) {
          setTimeLeft("Starting now!");
          clearInterval(interval);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Active drop countdown (48h from drop_time)
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const dropTime = new Date(drop.drop_time).getTime();
        const endTime = dropTime + 48 * 60 * 60 * 1000;
        const diff = endTime - now;
        const totalDuration = 48 * 60 * 60 * 1000;
        setProgress((diff / totalDuration) * 100);

        if (diff <= 0) {
          setTimeLeft("Ended");
          clearInterval(interval);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [drop.drop_time, isActive]);

  const discountedPrice = drop.product.price * (1 - (drop.discount_percent || 0) / 100);

  return (
    <Card
      className={cn(
        "group overflow-hidden border transition-all duration-300 hover:scale-[1.02]",
        isActive
          ? "border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50"
          : "border-border bg-card hover:border-emerald-500/30"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {drop.product.image_url ? (
          <img
            src={drop.product.image_url}
            alt={drop.product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              <Flame className="h-3 w-3" />
              LIVE
            </div>
          )}
          {drop.discount_percent > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              -{drop.discount_percent}%
            </div>
          )}
        </div>

        {/* Countdown Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center gap-2">
            <Clock className={cn("h-3.5 w-3.5", isActive ? "text-rose-400" : "text-emerald-400")} />
            <span
              className={cn(
                "text-xs font-mono font-bold",
                isActive ? "text-rose-400" : "text-emerald-400"
              )}
            >
              {timeLeft}
            </span>
          </div>
          {isActive && (
            <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(0, progress)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {drop.product.title}
          </h3>
          <span className="text-xs text-muted-foreground shrink-0">
            {drop.quantity} left
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-[10px] text-emerald-400">
              {drop.seller.full_name?.charAt(0)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {drop.seller.full_name}
          </span>
          <VerificationBadge
            status={drop.seller.is_verified ? "verified" : "unverified"}
            size="sm"
          />
        </div>

        <div className="flex items-end justify-between">
          <div>
            {drop.discount_percent > 0 && (
              <p className="text-xs text-muted-foreground line-through">
                ₦{drop.product.price.toLocaleString()}
              </p>
            )}
            <p className="text-lg font-bold text-emerald-400">
              ₦{Math.round(discountedPrice).toLocaleString()}
            </p>
          </div>
          <Link href={`/marketplace/${drop.product.id}`}>
            <Button
              size="sm"
              className={cn(
                isActive
                  ? "bg-rose-600 hover:bg-rose-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              )}
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              {isActive ? "Grab Now" : "Remind Me"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
