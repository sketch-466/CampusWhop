"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BookmarkButton({
  novelId,
  initialBookmarked,
}: {
  novelId: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (bookmarked) {
        await supabase
          .from("novel_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("novel_id", novelId);
        setBookmarked(false);
      } else {
        await supabase
          .from("novel_bookmarks")
          .upsert({ user_id: user.id, novel_id: novelId, last_chapter_read: 0 },
            { onConflict: "user_id,novel_id" });
        setBookmarked(true);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        bookmarked
          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
      }`}
    >
      {bookmarked ? (
        <>
          <BookmarkCheck className="h-3.5 w-3.5" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5" />
          Bookmark
        </>
      )}
    </button>
  );
}