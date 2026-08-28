import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import ShareButton from "@/components/shared/share-button";
import { Star } from "lucide-react";

interface Seller {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  reputation_score: number | null;
  total_reviews: number | null;
  is_founding_creator?: boolean | null;
}

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    product_type: string;
    images: string[];
    is_featured?: boolean | null;
    seller: Seller | null;
  };
  referralCode?: string;
}

export function ListingCard({ listing, referralCode }: ListingCardProps) {
  const seller = listing.seller ?? {
    full_name: null,
    avatar_url: null,
    university: null,
    reputation_score: 0,
    total_reviews: 0,
    is_founding_creator: false,
  };

  const initials = seller.full_name
    ? seller.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CW";

  const categoryLabels: Record<string, string> = {
    phones: "Phones",
    laptops: "Laptops",
    books: "Books",
    gadgets: "Gadgets",
    services: "Services",
    notes: "Notes",
    templates: "Templates",
    ebooks: "Ebooks",
    designs: "Designs",
    other: "Other",
  };

  return (
    <div className="relative group">
      {/* Share button — sits outside the Link */}
       <div className="absolute top-2 left-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
  <ShareButton
    listingId={listing.id}
    title={listing.title}
    referralCode={referralCode}
  />
</div>

      <Link
        href={`/marketplace/${listing.id}`}
        className="block rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
      >
        <div className="aspect-square bg-zinc-800 relative overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600 text-sm">
              No image
            </div>
          )}

          {listing.is_featured && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1 bg-amber-500/90 py-1 text-[10px] font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              Featured
            </div>
          )}

          <Badge
            variant="outline"
            className="absolute top-2 right-2 bg-zinc-950/80"
          >
            {listing.product_type === "physical" ? "Physical" : "Digital"}
          </Badge>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="text-[10px]">
              {categoryLabels[listing.category] || listing.category}
            </Badge>
          </div>
          <h3 className="font-medium text-white line-clamp-2">
            {listing.title}
          </h3>
          <p className="mt-1 text-lg font-bold text-emerald-500">
            ₦{listing.price.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              {seller.avatar_url && (
                <AvatarImage
                  src={seller.avatar_url}
                  alt={seller.full_name || ""}
                />
              )}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-zinc-400">
              {seller.full_name || "Unknown"}
            </span>
            {seller.is_founding_creator && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                🌟 Founder
              </span>
            )}
            <ReputationBadge
              score={seller.reputation_score || 0}
              totalReviews={seller.total_reviews || 0}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}