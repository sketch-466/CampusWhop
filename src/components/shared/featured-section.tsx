"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedListing {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  product_type: string;
  _type: "listing";
  seller: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface FeaturedProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  product_type: string;
  delivery_timeframe?: string | null;
  _type: "store_product";
  store: {
    slug: string;
    store_name: string;
  } | null;
}

interface FeaturedSectionProps {
  listings: FeaturedListing[];
  products: FeaturedProduct[];
}

export function FeaturedSection({ listings, products }: FeaturedSectionProps) {
  const all = [
    ...listings.map((l) => ({ ...l, _type: "listing" as const })),
    ...products.map((p) => ({ ...p, _type: "store_product" as const })),
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH = 172; // 160px card + 12px gap
  const AUTO_SCROLL_INTERVAL = 3000;

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "right" ? CARD_WIDTH * 2 : -CARD_WIDTH * 2, behavior: "smooth" });
  };

  // Auto-scroll
  useEffect(() => {
    if (all.length <= 2) return;

    const interval = setInterval(() => {
      if (isPaused) return;
      const el = scrollRef.current;
      if (!el) return;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: CARD_WIDTH, behavior: "smooth" });
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, all.length]);

  // Update buttons on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    updateScrollButtons();
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, []);

  if (all.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            Featured
          </h2>
        </div>

        {/* Desktop scroll buttons */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {all.map((item) => {
          const href =
            item._type === "listing"
              ? `/marketplace/${item.id}`
              : `/store/${(item as FeaturedProduct).store?.slug}/${item.id}`;

          const subtitle =
            item._type === "listing"
              ? (item as FeaturedListing).seller?.full_name ?? "Unknown"
              : (item as FeaturedProduct).store?.store_name ?? "Store";

          return (
            <Link
              key={`${item._type}-${item.id}`}
              href={href}
              className="group flex-shrink-0 w-40 rounded-xl border border-amber-800/40 bg-amber-900/10 overflow-hidden hover:border-amber-700/60 transition-colors"
            >
              <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                    No image
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Star className="h-2.5 w-2.5 fill-white" />
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-white truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">
                  ₦{item.price.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile dot indicators */}
      {all.length > 2 && (
        <div className="flex justify-center gap-1 mt-3 sm:hidden">
          {Array.from({ length: Math.min(all.length, 5) }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-1 rounded-full bg-zinc-700"
            />
          ))}
        </div>
      )}
    </section>
  );
}