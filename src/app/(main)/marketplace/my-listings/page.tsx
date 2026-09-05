import Link from "next/link";
import { getUserListings } from "@/lib/actions/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Trash2, Star } from "lucide-react";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  active: "success",
  rejected: "destructive",
  sold: "default",
  deleted: "default",
};

export default async function MyListingsPage() {
  const { listings, error } = await getUserListings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white">My Listings</h1>
        </div>
        <Link href="/marketplace/new">
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="text-red-400">{error}</p>
      ) : !listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">You haven't created any listings yet.</p>
          <Link href="/marketplace/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Create Your First Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: any) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="h-16 w-16 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{listing.title}</h3>
                  {listing.is_featured && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20 shrink-0">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-500">
                  ₦{listing.price.toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <Badge variant={statusColors[listing.status] || "default"}>
                    {listing.status}
                  </Badge>
                  {listing.is_featured && listing.featured_until && (
                    <span className="text-[10px] text-zinc-500">
                      Featured until {new Date(listing.featured_until).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  )}
                  {listing.rejection_reason && (
                    <span className="text-xs text-red-400">{listing.rejection_reason}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {listing.status === "active" && !listing.is_featured && (
                  <Link href={`/marketplace/feature/${listing.id}`}>
                    <button className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <Star className="h-3 w-3" />
                      Feature
                    </button>
                  </Link>
                )}
                <form
                  action={async () => {
                    "use server";
                    const { deleteListing } = await import("@/lib/actions/listings");
                    await deleteListing(listing.id);
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}