import { createClient } from "@/lib/supabase/server";
import { getNovels } from "@/lib/actions/novels";
import Link from "next/link";
import { BookOpen, Plus, Star } from "lucide-react";

const GENRES = [
  "All", "Romance", "Thriller", "Fantasy", "Campus Life",
  "Mystery", "Sci-Fi", "Drama", "Action", "Horror",
];

export default async function NovelsPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; search?: string }>;
}) {
  const params = await searchParams;
  const genre = params.genre === "All" || !params.genre ? undefined : params.genre;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { novels } = await getNovels({ genre, search: params.search });

  const featured = novels.filter((n: any) => n.is_featured);
  const regular = novels.filter((n: any) => !n.is_featured);

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Novels</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Stories by FUNAI students
            </p>
          </div>
          {user && (
            <Link
              href="/novels/new"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Write
            </Link>
          )}
        </div>

        {/* Search */}
        <form method="GET" className="mt-3">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search novels..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide border-b border-zinc-800">
        {GENRES.map((g) => (
          <Link
            key={g}
            href={g === "All" ? "/novels" : `/novels?genre=${g}`}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              (g === "All" && !params.genre) || params.genre === g
                ? "bg-emerald-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              Featured
            </h2>
            <div className="space-y-3">
              {featured.map((novel: any) => (
                <NovelCard key={novel.id} novel={novel} featured />
              ))}
            </div>
          </section>
        )}

        {/* All novels */}
        <section>
          {featured.length > 0 && (
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              All Novels
            </h2>
          )}
          {regular.length === 0 && featured.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="h-12 w-12 text-zinc-700 mb-4" />
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                No novels yet
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Be the first to publish a story on CampusWhop
              </p>
              {user && (
                <Link
                  href="/novels/new"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Start Writing
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {regular.map((novel: any) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NovelCard({ novel, featured }: { novel: any; featured?: boolean }) {
  const author = Array.isArray(novel.author) ? novel.author[0] : novel.author;

  if (featured) {
    return (
      <Link
        href={`/novels/${novel.id}`}
        className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 hover:bg-amber-500/10 transition-colors"
      >
        <div className="h-20 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
          {novel.cover_image_url ? (
            <img
              src={novel.cover_image_url}
              alt={novel.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-6 w-6 text-zinc-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              {novel.genre}
            </span>
            {novel.monetization === "freemium" && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                Freemium
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm line-clamp-1">
            {novel.title}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
            {novel.description}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            by {author?.full_name ?? "Unknown"} ·{" "}
            {novel.total_chapters} chapters
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/novels/${novel.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden hover:border-zinc-700 transition-colors"
    >
      <div className="aspect-[2/3] bg-zinc-800 relative">
        {novel.cover_image_url ? (
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
            <BookOpen className="h-8 w-8 text-zinc-600" />
            <p className="text-xs text-zinc-600 line-clamp-2">{novel.title}</p>
          </div>
        )}
        {novel.monetization === "freemium" && (
          <div className="absolute top-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            Coins
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-xs font-semibold text-white line-clamp-1">
          {novel.title}
        </h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {author?.full_name ?? "Unknown"} · {novel.total_chapters} ch
        </p>
        <span className="mt-1 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
          {novel.genre}
        </span>
      </div>
    </Link>
  );
}