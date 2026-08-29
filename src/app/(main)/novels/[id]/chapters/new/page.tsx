"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createChapter } from "@/lib/actions/novels";

export default function NewChapterPage() {
  const router = useRouter();
  const params = useParams();
  const novelId = params.id as string;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState < string > ();
  
  const wordCount = content.trim() ?
    content.trim().split(/\s+/).length :
    0;
  
  const handleSubmit = async () => {
    if (!title.trim()) return setError("Chapter title is required");
    if (content.trim().length < 100) {
      return setError("Chapter must be at least 100 characters");
    }
    
    setIsSubmitting(true);
    setError(undefined);
    
    const result = await createChapter({ novelId, title, content });
    
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    
    router.push(`/novels/${novelId}/chapters/${result.chapterNumber}`);
  };
  
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/novels/${novelId}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Novel
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {wordCount.toLocaleString()} words
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? "Publishing..." : "Publish Chapter"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chapter title..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-semibold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your chapter here...

Use double line breaks for paragraphs."
          rows={30}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}