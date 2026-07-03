import Link from "next/link";
import { getUserListings } from "@/lib/actions/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
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
      ) : listings.length === 0 ? (
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
                <h3 className="font-medium text-white truncate">
                  {listing.title}
                </h3>
                <p className="text-sm text-emerald-500">
                  ₦{listing.price.toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      (statusColors[listing.status] as
                        | "default"
                        | "success"
                        | "warning"
                        | "destructive") || "default"
                    }
                  >
                    {listing.status}
                  </Badge>
                  {listing.rejection_reason && (
                    <span className="text-xs text-red-400">
                      {listing.rejection_reason}
                    </span>
                  )}
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  const { deleteListing } = await import(
                    "@/lib/actions/listings"
                  );
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
          ))}
        </div>
      )}
    </div>
  );
}
