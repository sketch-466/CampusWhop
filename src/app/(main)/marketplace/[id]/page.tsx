import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getListingById } from "@/lib/actions/listings";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { BuyButton } from "@/components/shared/buy-button";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import ViewTracker from "@/components/shared/view-tracker";

function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

interface SellerProfile {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  reputation_score: number | null;
  total_reviews: number | null;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { listing: rawListing, error } = await getListingById(id);

  if (error || !rawListing) {
    redirect("/marketplace");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner = user?.id === rawListing.seller_id;

  const seller = normalizeRelation<SellerProfile>(rawListing.seller as SellerProfile | SellerProfile[] | null) ?? {
    full_name: null,
    avatar_url: null,
    university: null,
    reputation_score: 0,
    total_reviews: 0,
  };

  const initials = seller.full_name
    ? seller.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CW";

  const categoryLabels: Record<string, string> = {
    phones: "Phones",
    laptops: "Laptops",
    books: "Books",
    gadgets: "Gadgets",
    services: "Services",
    notes: "Notes",
    templates: "Templates",
    ebooks: "Ebooks",
    designs: "Designs",
    other: "Other",
  };

  const listingImages = (rawListing.images as string[]) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <ViewTracker entityType="listing" entityId={id} userId={user?.id ?? null} />

      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {listingImages.length > 0 ? (
              <img
                src={listingImages[0]}
                alt={rawListing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600">
                No image
              </div>
            )}
          </div>
          {listingImages.length > 1 && (
            <div className="flex gap-2">
              {listingImages.slice(1).map((img: string, i: number) => (
                <div
                  key={i}
                  className="h-16 w-16 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`${rawListing.title} ${i + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">
              {categoryLabels[rawListing.category] || rawListing.category}
            </Badge>
            <Badge variant={rawListing.product_type === "physical" ? "outline" : "success"}>
              {rawListing.product_type === "physical" ? "Physical" : "Digital"}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold text-white">{rawListing.title}</h1>
          <p className="text-3xl font-bold text-emerald-500">
            ₦{rawListing.price.toLocaleString()}
          </p>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {seller.avatar_url && (
                  <AvatarImage src={seller.avatar_url} alt={seller.full_name || ""} />
                )}
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">
                  {seller.full_name || "Unknown Seller"}
                </p>
                <p className="text-xs text-zinc-400">
                  {seller.university || "University not set"} ·{" "}
                  <ReputationBadge
                    score={seller.reputation_score || 0}
                    totalReviews={seller.total_reviews || 0}
                  />
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-white">Description</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
              {rawListing.description}
            </p>
          </div>

          {rawListing.delivery_note && (
            <div className="flex items-start gap-2 rounded-lg bg-zinc-900/50 p-3">
              <Package className="mt-0.5 h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs font-medium text-zinc-300">Delivery</p>
                <p className="text-xs text-zinc-500">{rawListing.delivery_note}</p>
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
              <p className="text-sm text-yellow-400">
                This is your listing. Buyers will see a Buy Now button here.
              </p>
            </div>
          ) : !user ? (
            <Link href="/login">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                Sign in to Buy
              </Button>
            </Link>
          ) : (
            <BuyButton
  listingId={rawListing.id}
  price={rawListing.price}
  paymentType={rawListing.payment_type as "escrow" | "direct" ?? "escrow"}
/>
          )}
        </div>
      </div>
    </div>
  );
}