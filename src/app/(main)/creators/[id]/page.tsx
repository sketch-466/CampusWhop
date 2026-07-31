import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Globe,
  Twitter,
  Linkedin,
  MessageCircle,
  Phone,
  CheckCircle2,
} from "lucide-react";
import {
  CREATOR_TYPE_LABELS,
  type CreatorType,
} from "@/lib/validations/profile";
import { getReviewsForUser } from "@/lib/actions/reviews";
import { StarRating } from "@/components/shared/star-rating";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import { SubscribeButton } from "@/components/shared/subscribe-button";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, university, bio, tagline, creator_type, skills, portfolio_url, twitter_url, linkedin_url, whatsapp_number, phone_number, is_verified, reputation_score, total_reviews"
    )
    .eq("id", id)
    .single();

  if (!profile || !profile.creator_type) notFound();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, images, product_type")
    .eq("seller_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: store } = await supabase
    .from("stores")
    .select("slug, store_name, logo_url, tagline")
    .eq("owner_id", id)
    .eq("status", "active")
    .eq("is_deleted", false)
    .single();

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("id, title, price, perks, description")
    .eq("creator_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const reviews = await getReviewsForUser(id);

  const skills: string[] = Array.isArray(profile.skills) ? profile.skills : [];

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const creatorLabel =
    CREATOR_TYPE_LABELS[profile.creator_type as CreatorType];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/creators"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </Link>

      {/* ── HERO ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 shrink-0">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
            )}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                {profile.full_name || "Creator"}
              </h1>
              {profile.is_verified && (
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              )}
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <Briefcase className="h-3 w-3" />
              {creatorLabel}
            </span>
            <p className="mt-1 text-sm text-zinc-400">
              {profile.university || "Nigerian University"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <ReputationBadge
                score={profile.reputation_score || 0}
                totalReviews={profile.total_reviews || 0}
                size="sm"
              />
            </div>
          </div>
        </div>

        {profile.tagline && (
          <p className="mt-5 text-base font-medium text-zinc-200">
            &ldquo;{profile.tagline}&rdquo;
          </p>
        )}

        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {profile.bio}
          </p>
        )}

        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-800 pt-5">
          {profile.whatsapp_number && (
            <a
              href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" />
              Message on WhatsApp
            </a>
          )}
          {profile.portfolio_url && (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Portfolio
            </a>
          )}
          {profile.twitter_url && (
            <a
              href={profile.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </a>
          )}
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
          {profile.phone_number && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Phone className="h-4 w-4 text-emerald-500" />
              {profile.phone_number}
            </span>
          )}
        </div>
      </div>

      {/* ── SUBSCRIPTION PLANS ── */}
      {plans && plans.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Subscription Plans</h2>
          <div className="space-y-3">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{plan.title}</p>
                    {plan.description && (
                      <p className="mt-0.5 text-xs text-zinc-400">{plan.description}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-400">
                    ₦{plan.price?.toLocaleString()}/mo
                  </p>
                </div>
                {plan.perks?.length > 0 && (
                  <ul className="space-y-1">
                    {plan.perks.map((perk: string) => (
                      <li key={perk} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                )}
                <SubscribeButton planId={plan.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STORE ── */}
      {store && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Store</h2>
          <Link
            href={`/store/${store.slug}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-600"
          >
            <Avatar className="h-10 w-10">
              {store.logo_url && (
                <AvatarImage src={store.logo_url} alt={store.store_name} />
              )}
              <AvatarFallback>{store.store_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{store.store_name}</p>
              {store.tagline && (
                <p className="text-xs text-zinc-400">{store.tagline}</p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* ── LISTINGS ── */}
      {listings && listings.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listings.map((listing) => {
              const image =
                Array.isArray(listing.images) && listing.images.length > 0
                  ? listing.images[0]
                  : null;
              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-zinc-600"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={listing.title}
                      className="mb-2 h-24 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="mb-2 h-24 w-full rounded-md bg-zinc-800" />
                  )}
                  <p className="truncate text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {listing.title}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-400">
                    ₦{listing.price.toLocaleString()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REVIEWS ── */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">
          Reviews{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({reviews.length})
          </span>
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-zinc-500 capitalize">
                      {review.reviewerRole}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{review.comment}</p>
                <p className="text-xs text-zinc-500">
                  by {review.reviewer.fullName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}