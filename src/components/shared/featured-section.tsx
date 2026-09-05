import Link from "next/link";
import { Star } from "lucide-react";

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

  if (all.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
          Featured
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
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
    </section>
  );
}