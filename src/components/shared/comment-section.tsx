"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { postComment } from "@/lib/actions/novels";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function CommentSection({
  chapterId,
  novelId,
  comments,
  currentUserId,
}: {
  chapterId: string;
  novelId: string;
  comments: Comment[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleSubmit = () => {
    if (!input.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const result = await postComment(chapterId, novelId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInput("");
      router.refresh();
    });
  };

  return (
    <div className="mt-10 pt-6 border-t border-zinc-800">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {/* Comment input */}
      {currentUserId ? (
        <div className="flex items-end gap-2 mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Leave a comment..."
            rows={2}
            maxLength={500}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 mb-6">
          <a href="/login" className="text-emerald-400 hover:underline">
            Sign in
          </a>{" "}
          to leave a comment.
        </p>
      )}

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const user = Array.isArray(comment.user)
              ? comment.user[0]
              : comment.user;
            const name = user?.full_name ?? "Unknown";
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-300">{name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(comment.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}