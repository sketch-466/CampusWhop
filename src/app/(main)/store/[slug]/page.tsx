import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreBySlug, getStoreProducts } from "@/lib/actions/store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import { StoreProductCard } from "@/components/store/StoreProductCard";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { store, error } = await getStoreBySlug(slug);

  if (error || !store) {
    notFound();
  }

  const { products } = await getStoreProducts(store.id);

  const owner = store.owner;
  const initials = owner?.full_name
    ? owner.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CW";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="relative h-48 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden mb-8">
        {store.banner_url ? (
          <img src={store.banner_url} alt={store.store_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <span className="text-zinc-600 text-lg">{store.store_name}</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 mb-8">
        <Avatar className="h-20 w-20 border-2 border-zinc-800">
          {store.logo_url && <AvatarImage src={store.logo_url} alt={store.store_name} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{store.store_name}</h1>
          {store.tagline && <p className="text-zinc-400">{store.tagline}</p>}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {owner?.avatar_url && <AvatarImage src={owner.avatar_url} alt={owner.full_name || ""} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-300">{owner?.full_name || "Unknown"}</span>
            </div>
            <span className="text-zinc-600">·</span>
            <ReputationBadge score={owner?.reputation_score || 0} totalReviews={owner?.total_reviews || 0} />
          </div>
        </div>
      </div>

      {store.description && (
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{store.description}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">Products</h2>
      {!products || products.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No products available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <StoreProductCard key={product.id} product={product} storeSlug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
