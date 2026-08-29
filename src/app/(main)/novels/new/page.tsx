"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X } from "lucide-react";
import { createNovel, uploadNovelCover, updateNovelCover } from "@/lib/actions/novels";

const GENRES = [
  "Romance", "Thriller", "Fantasy", "Campus Life",
  "Mystery", "Sci-Fi", "Drama", "Action", "Horror",
];

export default function NewNovelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: GENRES[0],
    monetization: "free" as "free" | "freemium",
    free_chapters_count: 10,
    coins_per_chapter: 5,
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const formData = new FormData();
    formData.append("cover", file);
    const result = await uploadNovelCover(formData);
    if (result.error) setError(result.error);
    else if (result.url) setCoverUrl(result.url);
    setUploadingCover(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError("Title is required");
    if (!form.description.trim()) return setError("Description is required");

    setIsSubmitting(true);
    setError(undefined);

    const result = await createNovel(form);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // Upload cover if provided
    if (coverUrl && result.novelId) {
      await updateNovelCover(result.novelId, coverUrl);
    }

    router.push(`/novels/${result.novelId}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/novels"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Novels
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Create New Novel</h1>

      <div className="space-y-6">
        {/* Cover upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Cover Image (Optional)
          </label>
          {coverUrl ? (
            <div className="relative w-32 h-48 rounded-lg overflow-hidden border border-zinc-700">
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
              <button
                onClick={() => setCoverUrl("")}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex w-32 h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors">
              <Upload className="h-6 w-6 text-zinc-500" />
              <span className="mt-1 text-xs text-zinc-500">
                {uploadingCover ? "Uploading..." : "Cover"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter your novel title..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is your novel about?"
            rows={4}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Genre */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Genre</label>
          <select
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Monetization */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Monetization</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, monetization: "free" })}
              className={`rounded-xl border p-4 text-left transition-colors ${
                form.monetization === "free"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-700 bg-zinc-900/50"
              }`}
            >
              <p className="text-sm font-semibold text-white">📖 Free</p>
              <p className="text-xs text-zinc-400 mt-1">
                All chapters free. Build your audience.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, monetization: "freemium" })}
              className={`rounded-xl border p-4 text-left transition-colors ${
                form.monetization === "freemium"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-700 bg-zinc-900/50"
              }`}
            >
              <p className="text-sm font-semibold text-white">🪙 Freemium</p>
              <p className="text-xs text-zinc-400 mt-1">
                First N chapters free, rest costs coins.
              </p>
            </button>
          </div>
        </div>

        {/* Freemium settings */}
        {form.monetization === "freemium" && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Free chapters before paywall
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.free_chapters_count}
                onChange={(e) =>
                  setForm({ ...form, free_chapters_count: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                Readers get the first {form.free_chapters_count} chapters free
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Coins per locked chapter
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.coins_per_chapter}
                onChange={(e) =>
                  setForm({ ...form, coins_per_chapter: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                You earn ₦{(form.coins_per_chapter * 2 * 0.7).toFixed(0)} per unlock
                (70% of ₦{form.coins_per_chapter * 2})
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Creating..." : "Create Novel"}
        </button>
      </div>
    </div>
  );
}