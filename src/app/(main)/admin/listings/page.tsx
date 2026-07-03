import { redirect } from "next/navigation";
import { getPendingListings, approveListing, rejectListing } from "@/lib/actions/listings";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  const { listings, error } = await getPendingListings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-white">Admin: Pending Listings</h1>

      {error ? (
        <p className="mt-4 text-red-400">{error}</p>
      ) : !listings || listings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-zinc-400">No pending listings to review.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((listing: any) => (
            <div
              key={listing.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{listing.title}</h3>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <p className="text-sm text-emerald-500">
                    ₦{listing.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {listing.category} · {listing.product_type}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {listing.seller?.avatar_url && (
                        <AvatarImage
                          src={listing.seller.avatar_url}
                          alt={listing.seller.full_name}
                        />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {listing.seller?.full_name
                          ? listing.seller.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-zinc-400">
                      {listing.seller?.full_name || "Unknown"} ·{" "}
                      {listing.seller?.university || ""}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {listing.seller?.email || ""}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await approveListing(listing.id);
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await rejectListing(listing.id, "Does not meet marketplace guidelines");
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-400 hover:bg-red-900/20"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
