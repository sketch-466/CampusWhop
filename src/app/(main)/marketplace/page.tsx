import Link from "next/link";
import { getActiveListings } from "@/lib/actions/listings";
import { getFeaturedItems } from "@/lib/actions/features";
import { ListingCard } from "@/components/shared/listing-card";
import { FeaturedSection } from "@/components/shared/featured-section";
import { Plus } from "lucide-react";
import { MarketplaceFilters } from "@/components/shared/marketplace-filters";

const categories = [
  { value: "phones", label: "📱 Phones" },
  { value: "laptops", label: "💻 Laptops" },
  { value: "books", label: "📚 Books" },
  { value: "gadgets", label: "🔌 Gadgets" },
  { value: "services", label: "🛠 Services" },
  { value: "notes", label: "📝 Notes" },
  { value: "templates", label: "🗂 Templates" },
  { value: "ebooks", label: "📖 Ebooks" },
  { value: "designs", label: "🎨 Designs" },
  { value: "other", label: "📦 Other" },
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

  const [{ listings, error }, { listings: featuredListings, products: featuredProducts }] =
    await Promise.all([
      getActiveListings({ category, search, product_type: productType }),
      getFeaturedItems(),
    ]);

  const showFeatured = !category && !search && !productType;
  const activeFiltersCount = [category, productType].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          {(search || category || productType) && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {listings?.length ?? 0} result{listings?.length !== 1 ? "s" : ""}
              {search ? ` for "${search}"` : ""}
              {category ? ` in ${categories.find(c => c.value === category)?.label ?? category}` : ""}
            </p>
          )}
        </div>
        <Link
          href="/marketplace/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Sell Something</span>
          <span className="sm:hidden">Sell</span>
        </Link>
      </div>

      {/* Filters — client component for instant search */}
      <MarketplaceFilters
        categories={categories}
        activeCategory={category}
        activeType={productType}
        activeSearch={search}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Featured section */}
      {showFeatured && (
        <FeaturedSection
          listings={featuredListings}
          products={featuredProducts}
        />
      )}

      {/* Active filter summary */}
      {(category || productType || search) && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-zinc-500">
            Showing {listings?.length ?? 0} listing{listings?.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/marketplace"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Clear filters
          </Link>
        </div>
      )}

      {/* Grid */}
      {error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : !listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No listings found.</p>
          <p className="mt-1 text-sm text-zinc-500">
            {search ? "Try a different search term." : "Be the first to sell something on CampusWhop!"}
          </p>
          {(category || productType || search) && (
            <Link
              href="/marketplace"
              className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
            >
              Browse all listings
            </Link>
          )}
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