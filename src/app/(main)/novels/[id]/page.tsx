import { redirect } from "next/navigation";
import Link from "next/link";
import { getNovelById } from "@/lib/actions/novels";
import { createClient } from "@/lib/supabase/server";
import {
  BookOpen, Plus, Users, Eye, Lock, ArrowLeft,
} from "lucide-react";
import FollowButton from "@/components/shared/follow-button";
import BookmarkButton from "@/components/shared/bookmark-button";

export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getNovelById(id);

  if ("error" in result && result.error) redirect("/novels");

  const { novel, chapters, isFollowing, isBookmarked, currentUserId } = result as any;
  const author = Array.isArray(novel.author) ? novel.author[0] : novel.author;
  const isAuthor = currentUserId === novel.author_id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
      <Link
        href="/novels"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Novels
      </Link>

      {/* Novel header */}
      <div className="flex gap-4 mb-6">
        <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
          {novel.cover_image_url ? (
            <img
              src={novel.cover_image_url}
              alt={novel.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-zinc-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              {novel.genre}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 capitalize">
              {novel.status}
            </span>
            {novel.monetization === "freemium" && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                🪙 Freemium
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white leading-tight">
            {novel.title}
          </h1>

          <Link
            href={`/creators/${novel.author_id}`}
            className="text-xs text-zinc-400 hover:text-white mt-0.5 inline-block"
          >
            by {author?.full_name ?? "Unknown"}
          </Link>

          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {novel.total_chapters} chapters
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {novel.total_reads.toLocaleString()} reads
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {chapters.length > 0 && (
              <Link
                href={`/novels/${id}/chapters/1`}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {isBookmarked ? "Continue Reading" : "Start Reading"}
              </Link>
            )}
            {currentUserId && !isAuthor && (
              <>
                <FollowButton
                  authorId={novel.author_id}
                  initialFollowing={isFollowing}
                />
                <BookmarkButton
                  novelId={id}
                  initialBookmarked={isBookmarked}
                />
              </>
            )}
            {isAuthor && (
              <Link
                href={`/novels/${id}/chapters/new`}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Chapter
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 mb-6">
        <h2 className="text-sm font-semibold text-white mb-2">Synopsis</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">{novel.description}</p>
      </div>

      {/* Freemium info */}
      {novel.monetization === "freemium" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-medium text-amber-400">Freemium Novel</p>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            First {novel.free_chapters_count} chapters are free.
            Locked chapters cost {novel.coins_per_chapter} coins each.
          </p>
          <Link
            href="/coins"
            className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
          >
            Buy coins →
          </Link>
        </div>
      )}

      {/* Chapter list */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">
          Chapters ({chapters.length})
        </h2>

        {chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500">No chapters yet.</p>
            {isAuthor && (
              <Link
                href={`/novels/${id}/chapters/new`}
                className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Write First Chapter
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {chapters.map((ch: any) => {
              const isFree =
                novel.monetization === "free" || ch.is_free;
              return (
                <Link
                  key={ch.id}
                  href={`/novels/${id}/chapters/${ch.chapter_number}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 text-xs font-mono text-zinc-600 w-8">
                      {String(ch.chapter_number).padStart(3, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {ch.title}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {ch.word_count.toLocaleString()} words ·{" "}
                        {ch.reads_count} reads
                      </p>
                    </div>
                  </div>
                  {!isFree && (
                    <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                      <span className="text-[10px] text-amber-400">
                        🪙 {novel.coins_per_chapter}
                      </span>
                    </div>
                  )}
                  {isFree && (
                    <span className="flex-shrink-0 text-[10px] text-emerald-400">
                      Free
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}