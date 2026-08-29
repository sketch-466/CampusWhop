import { redirect } from "next/navigation";
import Link from "next/link";
import { getChapter } from "@/lib/actions/novels";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import UnlockButton from "@/components/shared/unlock-button";
import CommentSection from "@/components/shared/comment-section";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterNum: string }>;
}) {
  const { id, chapterNum } = await params;
  const chapterNumber = parseInt(chapterNum);

  if (isNaN(chapterNumber)) redirect(`/novels/${id}`);

  const result = await getChapter(id, chapterNumber);

  if ("error" in result && result.error) redirect(`/novels/${id}`);

  const {
    novel, chapter, hasAccess, isFreeChapter,
    isAuthor, prevChapter, nextChapter,
    comments, currentUserId, coinsRequired,
  } = result as any;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/novels/${id}`}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 truncate">{novel.title}</p>
          <h1 className="text-base font-bold text-white truncate">
            Chapter {chapterNumber}: {chapter.title}
          </h1>
        </div>
      </div>

      {/* Chapter content or lock screen */}
      {hasAccess ? (
        <div className="prose prose-invert prose-sm max-w-none">
          {chapter.content.split("\n\n").map((para: string, i: number) => (
            <p key={i} className="text-zinc-300 leading-relaxed mb-4 text-[15px]">
              {para}
            </p>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <Lock className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">
            Locked Chapter
          </h2>
          <p className="text-sm text-zinc-400 mb-2">
            This chapter costs {coinsRequired} coins to unlock.
          </p>
          <p className="text-xs text-zinc-500 mb-6">
            You earn permanent access — unlock once, read forever.
          </p>

          {currentUserId ? (
            <UnlockButton
              chapterId={chapter.id}
              novelId={id}
              coinsRequired={coinsRequired}
            />
          ) : (
            <Link
              href="/login"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in to Read
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      {hasAccess && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
          {prevChapter ? (
            <Link
              href={`/novels/${id}/chapters/${prevChapter.chapter_number}`}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="truncate max-w-[120px]">
                Ch.{prevChapter.chapter_number}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              href={`/novels/${id}/chapters/${nextChapter.chapter_number}`}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <span className="truncate max-w-[120px]">
                Ch.{nextChapter.chapter_number}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="rounded-lg border border-zinc-800 px-4 py-2.5 text-xs text-zinc-600">
              Latest chapter
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {hasAccess && (
        <CommentSection
          chapterId={chapter.id}
          novelId={id}
          comments={comments}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}