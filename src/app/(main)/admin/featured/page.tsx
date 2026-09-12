import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Star } from "lucide-react";

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const now = new Date().toISOString();

  const [{ data: activeListings }, { data: activeProducts }] = await Promise.all([
    adminClient
      .from("listings")
      .select(`*, profiles!listings_seller_id_fkey(full_name, email)`)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    adminClient
      .from("store_products")
      .select(`*, store:stores!store_products_store_id_fkey(store_name, slug)`)
      .eq("status", "active")
      .eq("is_deleted", false)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  async function featureListing(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const days = parseInt(formData.get("days") as string) || 30;
    const adminClient = createAdminClient();
    const until = new Date();
    until.setDate(until.getDate() + days);
    await adminClient
      .from("listings")
      .update({
        is_featured: true,
        featured_until: until.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/admin/featured");
    revalidatePath("/marketplace");
    revalidatePath("/");
  }

  async function unfeatureListing(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const adminClient = createAdminClient();
    await adminClient
      .from("listings")
      .update({
        is_featured: false,
        featured_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/admin/featured");
    revalidatePath("/marketplace");
    revalidatePath("/");
  }

  async function featureProduct(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const days = parseInt(formData.get("days") as string) || 30;
    const adminClient = createAdminClient();
    const until = new Date();
    until.setDate(until.getDate() + days);
    await adminClient
      .from("store_products")
      .update({
        is_featured: true,
        featured_until: until.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/admin/featured");
    revalidatePath("/store");
    revalidatePath("/");
  }

  async function unfeatureProduct(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const adminClient = createAdminClient();
    await adminClient
      .from("store_products")
      .update({
        is_featured: false,
        featured_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/admin/featured");
    revalidatePath("/store");
    revalidatePath("/");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">Featured Management</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Feature listings and store products to promote them across the platform.
        </p>
      </div>

      {/* Listings */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Active Listings ({activeListings?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {(activeListings || []).map((listing: any) => {
            const isFeatured =
              listing.is_featured &&
              listing.featured_until &&
              listing.featured_until > now;
            const seller = Array.isArray(listing.profiles)
              ? listing.profiles[0]
              : listing.profiles;

            return (
              <div
                key={listing.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isFeatured
                    ? "border-amber-800/40 bg-amber-900/10"
                    : "border-zinc-800 bg-zinc-900/30"
                }`}
              >
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-zinc-900">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                      —
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-white truncate">
                      {listing.title}
                    </p>
                    {isFeatured && (
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    ₦{listing.price?.toLocaleString()} ·{" "}
                    {seller?.full_name ?? "Unknown"}
                  </p>
                  {isFeatured && listing.featured_until && (
                    <p className="text-xs text-amber-500/70">
                      Until{" "}
                      {new Date(listing.featured_until).toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </p>
                  )}
                </div>
                {isFeatured ? (
                  <form action={unfeatureListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                ) : (
                  <form action={featureListing} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={listing.id} />
                    <select
                      name="days"
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"
                    >
                      <option value="7">7d</option>
                      <option value="14">14d</option>
                      <option value="30">30d</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                      <Star className="h-3 w-3" />
                      Feature
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Store Products */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Store Products ({activeProducts?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {(activeProducts || []).map((product: any) => {
            const isFeatured =
              product.is_featured &&
              product.featured_until &&
              product.featured_until > now;
            const store = Array.isArray(product.store)
              ? product.store[0]
              : product.store;

            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isFeatured
                    ? "border-amber-800/40 bg-amber-900/10"
                    : "border-zinc-800 bg-zinc-900/30"
                }`}
              >
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-zinc-900">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                      —
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-white truncate">
                      {product.title}
                    </p>
                    {isFeatured && (
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    ₦{product.price?.toLocaleString()} ·{" "}
                    {store?.store_name ?? "Unknown"}
                  </p>
                  {isFeatured && product.featured_until && (
                    <p className="text-xs text-amber-500/70">
                      Until{" "}
                      {new Date(product.featured_until).toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </p>
                  )}
                </div>
                {isFeatured ? (
                  <form action={unfeatureProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                ) : (
                  <form action={featureProduct} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={product.id} />
                    <select
                      name="days"
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"
                    >
                      <option value="7">7d</option>
                      <option value="14">14d</option>
                      <option value="30">30d</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                      <Star className="h-3 w-3" />
                      Feature
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}