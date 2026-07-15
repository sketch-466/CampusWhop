"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface StoreProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    product_type: string;
    images: string[];
    status: string;
    stock_quantity: number | null;
  };
  storeSlug: string;
}

export function StoreProductCard({ product, storeSlug }: StoreProductCardProps) {
  const isOutOfStock =
    product.product_type === "physical" &&
    product.stock_quantity !== null &&
    product.stock_quantity <= 0;

  return (
    <Link href={`/store/${storeSlug}/${product.id}`}>
      <div className="group rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors hover:border-zinc-700">
        <div className="aspect-square bg-zinc-900 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              No image
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={product.product_type === "physical" ? "outline" : "default"} className="text-xs">
              {product.product_type === "physical" ? "Physical" : "Digital"}
            </Badge>
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            )}
          </div>
          <h3 className="font-medium text-white truncate">{product.title}</h3>
          <p className="text-sm text-emerald-500 font-semibold">
            ₦{product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
