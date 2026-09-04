"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface StoreProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    product_type: string;
    images: string[];
    status: string;
    stock_quantity: number | null;
    delivery_timeframe?: string | null;
  };
  storeSlug: string;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  physical: { label: "Physical", className: "border-zinc-600 text-zinc-300" },
  digital: { label: "Digital", className: "bg-emerald-900/40 text-emerald-400 border-emerald-800" },
  service: { label: "Service", className: "bg-blue-900/40 text-blue-400 border-blue-800" },
};

export function StoreProductCard({ product, storeSlug }: StoreProductCardProps) {
  const isOutOfStock =
    product.status === "sold_out" ||
    (product.product_type === "physical" &&
      product.stock_quantity !== null &&
      product.stock_quantity <= 0);

  const isDemo = product.status === "demo";
  const badge = TYPE_BADGE[product.product_type] ?? TYPE_BADGE.physical;

  return (
    <Link href={`/store/${storeSlug}/${product.id}`}>
      <div className="group rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors hover:border-zinc-700">
        <div className="aspect-square bg-zinc-900 overflow-hidden relative">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600 text-sm">
              No image
            </div>
          )}
          {isDemo && (
            <div className="absolute top-2 right-2">
              <span className="rounded-full bg-zinc-800/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 border border-zinc-700">
                Demo
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-xs ${badge.className}`}>
              {badge.label}
            </Badge>
            {isOutOfStock && !isDemo && (
              <Badge variant="destructive" className="text-xs">Sold Out</Badge>
            )}
          </div>
          <h3 className="font-medium text-white truncate">{product.title}</h3>
          <p className="text-sm text-emerald-500 font-semibold mt-0.5">
            ₦{product.price.toLocaleString()}
          </p>
          {product.product_type === "service" && product.delivery_timeframe && (
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              {product.delivery_timeframe}
            </p>
          )}
          {isDemo && (
            <p className="mt-1 text-xs text-zinc-500 italic">Sample listing</p>
          )}
        </div>
      </div>
    </Link>
  );
}