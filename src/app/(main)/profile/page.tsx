import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MessageCircle,
  Twitter,
  Linkedin,
  ArrowLeft,
  Pencil,
  Globe,
  BadgeCheck,
  Briefcase,
} from "lucide-react";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import { StarRating } from "@/components/shared/star-rating";
import { getReviewsForUser } from "@/lib/actions/reviews";
import { CREATOR_TYPE_LABELS, type CreatorType } from "@/lib/validations/profile";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const reviews = await getReviewsForUser(profile.id);

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email ?? "U")[0].toUpperCase();

  const creatorLabel = profile.creator_type
    ? CREATOR_TYPE_LABELS[profile.creator_type as CreatorType]
    : null;

  const skills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
  const isCreator = !!(profile.creator_type || profile.tagline || skills.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* ── HERO CARD ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 shrink-0">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
              )}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {profile.full_name || "Student"}
                </h1>
                {profile.is_verified && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                )}
              </div>
              {creatorLabel && (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <Briefcase className="h-3 w-3" />
                  {creatorLabel}
                </span>
              )}
              <p className="mt-1 text-sm text-zinc-400">
                {profile.university || "No university set"}
              </p>
            </div>
          </div>
          <Link href="/profile/edit" className="shrink-0">
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>

        {/* Tagline */}
        {profile.tagline && (
          <p className="mt-4 text-base font-medium text-zinc-200">
            &ldquo;{profile.tagline}&rdquo;
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
        )}

        {/* Skills */}
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

        {/* Contact & Links */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {profile.phone_number && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Phone className="h-4 w-4 text-emerald-500" />
              {profile.phone_number}
            </span>
          )}
          {profile.whatsapp_number && (
            <a
              href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
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
        </div>
      </div>

      {/* ── CREATOR CTA (if profile incomplete) ── */}
      {!isCreator && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/20 p-4 text-center">
          <p className="text-sm text-zinc-400">
            Set up your creator profile to appear in the{" "}
            <Link href="/creators" className="text-emerald-400 hover:underline">
              Creators directory
            </Link>
            .
          </p>
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="mt-3">
              Complete Creator Profile
            </Button>
          </Link>
        </div>
      )}

      {/* ── REPUTATION ── */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Reputation</h2>
          <ReputationBadge
            score={profile.reputation_score || 0}
            totalReviews={profile.total_reviews || 0}
            size="md"
          />
        </div>

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
                <p className="text-xs text-zinc-500">by {review.reviewer.fullName}</p>
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