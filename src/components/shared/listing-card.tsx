import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    product_type: string;
    images: string[];
    seller: {
      full_name: string | null;
      avatar_url: string | null;
      university: string | null;
    };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const initials = listing.seller.full_name
    ? listing.seller.full_name
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
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
    >
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            No image
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
        <h3 className="font-medium text-white line-clamp-2">{listing.title}</h3>
        <p className="mt-1 text-lg font-bold text-emerald-500">
          ₦{listing.price.toLocaleString()}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="h-5 w-5">
            {listing.seller.avatar_url && (
              <AvatarImage
                src={listing.seller.avatar_url}
                alt={listing.seller.full_name || ""}
              />
            )}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-zinc-400">
            {listing.seller.full_name || "Unknown"}
          </span>
          <span className="text-xs text-zinc-600">
            · {listing.seller.university || ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
