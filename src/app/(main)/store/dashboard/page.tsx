import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyStore, getStoreProducts } from "@/lib/actions/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Settings, Package } from "lucide-react";
import { StoreProductCard } from "@/components/store/StoreProductCard";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  active: "success",
  suspended: "destructive",
  rejected: "destructive",
};

export default async function StoreDashboardPage() {
  const { store } = await getMyStore();

  // No store yet — redirect to setup
  if (!store) {
    redirect("/store/setup");
  }

  const { products, error } = await getStoreProducts(store.id, true);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{store.store_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusColors[store.status] || "default"}>
                {store.status}
              </Badge>
              <span className="text-xs text-zinc-500">/store/{store.slug}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/store/setup">
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
              Edit Store
            </Button>
          </Link>
          <Link href="/store/dashboard/new">
            <Button size="sm" className="gap-1 bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Store Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-xs text-zinc-500">Products</p>
          <p className="text-2xl font-bold text-white">{products?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-xs text-zinc-500">Store Status</p>
          <p className="text-lg font-medium text-white capitalize">{store.status}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-xs text-zinc-500">Public URL</p>
          <Link href={`/store/${store.slug}`} className="text-sm text-emerald-400 hover:underline">
            View Storefront →
          </Link>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Your Products
      </h2>

      {error ? (
        <p className="text-red-400">{error}</p>
      ) : !products || products.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">You haven't added any products yet.</p>
          <Link href="/store/dashboard/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <div key={product.id} className="relative">
              <StoreProductCard product={product} storeSlug={store.slug} />
              <div className="absolute top-2 left-2">
                <Badge
                  variant={statusColors[product.status] || "default"}
                  className="text-xs"
                >
                  {product.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
