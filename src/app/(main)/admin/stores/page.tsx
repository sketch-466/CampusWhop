import { getPendingStores, getPendingStoreProducts } from "@/lib/actions/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle } from "lucide-react";

export default async function AdminStoresPage() {
  const storesResult = await getPendingStores();
  const productsResult = await getPendingStoreProducts();

  const stores = storesResult.stores || [];
  const products = productsResult.products || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Shield className="h-6 w-6 text-amber-400" />
        Admin: Stores & Products
      </h1>

      {/* Pending Stores */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Pending Stores ({stores.length})</h2>
        {stores.length === 0 ? (
          <p className="text-zinc-500">No pending stores.</p>
        ) : (
          <div className="space-y-3">
            {stores.map((store: any) => (
              <div key={store.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{store.store_name}</h3>
                  <p className="text-sm text-zinc-400">/{store.slug}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    By {store.owner?.full_name || "Unknown"} · {store.owner?.email} · {store.owner?.university}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await fetch("/api/admin/stores/approve", {
                      method: "POST",
                      body: JSON.stringify({ id: store.id }),
                      headers: { "Content-Type": "application/json" },
                    });
                  }}
                >
                  <Button type="submit" size="sm" className="gap-1 bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await fetch("/api/admin/stores/reject", {
                      method: "POST",
                      body: JSON.stringify({ id: store.id, reason: "Does not meet guidelines" }),
                      headers: { "Content-Type": "application/json" },
                    });
                  }}
                >
                  <Button type="submit" size="sm" variant="outline" className="gap-1 text-red-400 hover:bg-red-900/20">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Products */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Pending Products ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-zinc-500">No pending products.</p>
        ) : (
          <div className="space-y-3">
            {products.map((product: any) => (
              <div key={product.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="h-16 w-16 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{product.title}</h3>
                  <p className="text-sm text-emerald-500">₦{product.price?.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    From {product.store?.store_name} · <Badge variant="outline" className="text-xs">{product.product_type}</Badge>
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    const supabase = (await import("@/lib/supabase/server")).createClient();
                    const client = await supabase();
                    await client.from("store_products").update({ status: "active" }).eq("id", product.id);
                  }}
                >
                  <Button type="submit" size="sm" className="gap-1 bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    const supabase = (await import("@/lib/supabase/server")).createClient();
                    const client = await supabase();
                    await client.from("store_products").update({ status: "rejected", rejection_reason: "Does not meet guidelines" }).eq("id", product.id);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline" className="gap-1 text-red-400 hover:bg-red-900/20">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
