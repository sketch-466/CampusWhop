import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, Globe, Twitter, Linkedin, Users } from "lucide-react";
import {
  CREATOR_TYPES,
  CREATOR_TYPE_LABELS,
  type CreatorType,
} from "@/lib/validations/profile";

interface SearchParams {
  type?: string;
}

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { type } = await searchParams;
  const activeType = CREATOR_TYPES.includes(type as CreatorType)
    ? (type as CreatorType)
    : null;

  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, university, tagline, creator_type, skills, portfolio_url, twitter_url, linkedin_url, is_verified, reputation_score, total_reviews"
    )
    .not("creator_type", "is", null)
    .order("reputation_score", { ascending: false });

  if (activeType) {
    query = query.eq("creator_type", activeType);
  }

  const { data: creators } = await query.limit(60);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Creators</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Discover talented students you can hire or collaborate with.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href="/creators"
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !activeType
              ? "bg-emerald-500 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          All
        </Link>
        {CREATOR_TYPES.map((t) => (
          <Link
            key={t}
            href={`/creators?type=${t}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeType === t
                ? "bg-emerald-500 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {CREATOR_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {creators && creators.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => {
            const initials = creator.full_name
              ? creator.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?";

            const skills: string[] = Array.isArray(creator.skills)
              ? creator.skills
              : [];

            return (
              <Link
                key={creator.id}
                href={`/creators/${creator.id}`}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900/60"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    {creator.avatar_url && (
                      <AvatarImage
                        src={creator.avatar_url}
                        alt={creator.full_name || ""}
                      />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {creator.full_name || "Creator"}
                      </span>
                      {creator.is_verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                      )}
                    </div>
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      {CREATOR_TYPE_LABELS[creator.creator_type as CreatorType]}
                    </span>
                  </div>
                </div>

                {creator.tagline && (
                  <p className="mt-3 text-sm text-zinc-400 line-clamp-2">
                    {creator.tagline}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-500">
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {creator.total_reviews || 0} review
                    {creator.total_reviews !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    {creator.portfolio_url && (
                      <a
                        href={creator.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="Portfolio"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {creator.twitter_url && (
                      <a
                        href={creator.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {creator.linkedin_url && (
                      <a
                        href={creator.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Users className="h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">
            {activeType
              ? `No ${CREATOR_TYPE_LABELS[activeType]} creators yet.`
              : "No creators yet."}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Be the first —{" "}
            <Link
              href="/profile/edit"
              className="text-emerald-400 hover:underline"
            >
              set up your creator profile
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}