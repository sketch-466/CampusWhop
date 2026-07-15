import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreBySlug, getStoreProductById } from "@/lib/actions/store";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import { StoreBuyButton } from "@/components/store/StoreBuyButton";

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const { product, error } = await getStoreProductById(productId);
  if (error || !product) notFound();

  const { store } = await getStoreBySlug(slug);
  if (!store || store.id !== product.store_id) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner = user?.id === store.owner_id;

  const isOutOfStock =
    product.product_type === "physical" &&
    product.stock_quantity !== null &&
    product.stock_quantity <= 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href={`/store/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to {store.store_name}
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {product.images?.length > 0 ? (
              <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600">No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(1).map((img: string, i: number) => (
                <div key={i} className="h-16 w-16 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <img src={img} alt={`${product.title} ${i + 2}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
         <div className="flex items-center gap-2">
  <Badge variant={product.product_type === "physical" ? "outline" : "default"}>
    {product.product_type === "physical" ? "Physical" : "Digital"}
  </Badge>
  {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
</div>

          <h1 className="text-2xl font-bold text-white">{product.title}</h1>
          <p className="text-3xl font-bold text-emerald-500">₦{product.price.toLocaleString()}</p>

          <Link href={`/store/${slug}`} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 transition-colors">
            <Avatar className="h-10 w-10">
              {store.logo_url && <AvatarImage src={store.logo_url} alt={store.store_name} />}
              <AvatarFallback className="text-sm">{store.store_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{store.store_name}</p>
              <p className="text-xs text-zinc-400">
                <ReputationBadge score={store.owner?.reputation_score || 0} totalReviews={store.owner?.total_reviews || 0} />
              </p>
            </div>
          </Link>

          <div>
            <h3 className="font-medium text-white">Description</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">{product.description}</p>
          </div>

          {product.product_type === "digital" && product.digital_file_url && (
            <div className="flex items-start gap-2 rounded-lg bg-zinc-900/50 p-3">
              <Package className="mt-0.5 h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs font-medium text-zinc-300">Digital Delivery</p>
                <p className="text-xs text-zinc-500">Instant download after purchase</p>
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
              <p className="text-sm text-yellow-400">This is your product. Buyers will see a Buy Now button here.</p>
            </div>
          ) : !user ? (
            <Link href="/login">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">Sign in to Buy</Button>
            </Link>
          ) : isOutOfStock ? (
            <Button disabled className="w-full">Out of Stock</Button>
          ) : (
            <StoreBuyButton storeProductId={product.id} price={product.price} />
          )}
        </div>
      </div>
    </div>
  );
}
