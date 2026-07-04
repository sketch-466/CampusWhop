import { Suspense } from "react";
import Link from "next/link";
import { getActiveListings } from "@/lib/actions/listings";
import { ListingCard } from "@/components/shared/listing-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

const categories = [
  { value: "phones", label: "Phones" },
  { value: "laptops", label: "Laptops" },
  { value: "books", label: "Books" },
  { value: "gadgets", label: "Gadgets" },
  { value: "services", label: "Services" },
  { value: "notes", label: "Notes" },
  { value: "templates", label: "Templates" },
  { value: "ebooks", label: "Ebooks" },
  { value: "designs", label: "Designs" },
  { value: "other", label: "Other" },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const productType = typeof params.type === "string" ? params.type : undefined;

  const { listings, error } = await getActiveListings({
    category,
    search,
    product_type: productType,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <Link
          href="/marketplace/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Sell Something
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            name="search"
            placeholder="Search listings..."
            defaultValue={search}
            className="pl-10"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/marketplace">
          <Badge
            variant={!category && !productType ? "success" : "default"}
            className="cursor-pointer"
          >
            All
          </Badge>
        </Link>
        <Link href={`/marketplace?type=physical${category ? `&category=${category}` : ""}`}>
          <Badge
            variant={productType === "physical" ? "success" : "default"}
            className="cursor-pointer"
          >
            Physical
          </Badge>
        </Link>
        <Link href={`/marketplace?type=digital${category ? `&category=${category}` : ""}`}>
          <Badge
            variant={productType === "digital" ? "success" : "default"}
            className="cursor-pointer"
          >
            Digital
          </Badge>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/marketplace?category=${cat.value}${productType ? `&type=${productType}` : ""}`}
          >
            <Badge
              variant={category === cat.value ? "success" : "default"}
              className="cursor-pointer"
            >
              {cat.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Listings Grid */}
      {error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : !listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No listings found.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Be the first to sell something on CampusWhop!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(listings as any[]).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
