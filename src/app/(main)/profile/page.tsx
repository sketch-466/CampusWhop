import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  MessageCircle,
  Twitter,
  Linkedin,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { ReputationBadge } from "@/components/shared/reputation-badge";
import { StarRating } from "@/components/shared/star-rating";
import { getReviewsForUser } from "@/lib/actions/reviews";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  const reviews = await getReviewsForUser(profile.id);

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email ?? "U")[0].toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {profile.avatar_url && (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name || ""}
                />
              )}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-white">
                {profile.full_name || "Student"}
              </h1>
              <p className="text-sm text-zinc-400">
                {profile.university || "No university set"}
              </p>
              <p className="text-sm text-zinc-500">
                Matric: {profile.matric_number || "Not set"}
              </p>
            </div>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>

        {profile.bio && (
          <p className="mt-6 text-sm leading-relaxed text-zinc-300">
            {profile.bio}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {profile.phone_number && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Phone className="h-4 w-4 text-emerald-500" />
              {profile.phone_number}
            </div>
          )}
          {profile.whatsapp_number && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              {profile.whatsapp_number}
            </div>
          )}
          {profile.twitter_url && (
            <a
              href={profile.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
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
              className="flex items-center gap-2 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Reputation Section */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center gap-3 mb-4">
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
