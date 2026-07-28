import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Store } from "lucide-react";

interface StoreRow {
  id: string;
  slug: string;
  store_name: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner: {
    full_name: string | null;
    university: string | null;
    avatar_url: string | null;
  } | null;
}

function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

export default async function StoreDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("stores")
    .select(`
      id, slug, store_name, tagline, logo_url, banner_url,
      owner:profiles!stores_owner_id_fkey(full_name, university, avatar_url)
    `)
    .eq("status", "active")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("store_name", `%${search}%`);
  }

  const { data } = await query;

  const stores: StoreRow[] = (data ?? []).map((s) => ({
    ...s,
    owner: normalizeRelation(s.owner as any),
  }));

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Student Stores</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Browse stores run by students across Nigeria
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search stores..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </form>

      {stores.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <Store className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-zinc-400">
            {search ? "No stores match your search" : "No stores yet"}
          </p>
          {search && (
            <Link
              href="/store"
              className="mt-3 inline-block text-sm text-emerald-400 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-600 transition-colors"
            >
              {/* Banner */}
              <div className="relative h-24 bg-zinc-800">
                {store.banner_url ? (
                  <img
                    src={store.banner_url}
                    alt={store.store_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-emerald-900/40 to-zinc-800" />
                )}

                {/* Logo */}
                <div className="absolute -bottom-5 left-4">
                  <div className="h-12 w-12 rounded-xl border-2 border-zinc-900 bg-zinc-800 overflow-hidden">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.store_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-900/50">
                        <span className="text-lg font-bold text-emerald-400">
                          {store.store_name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 pt-8 pb-4">
                <h2 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {store.store_name}
                </h2>
                {store.tagline && (
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                    {store.tagline}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {store.owner?.avatar_url ? (
                    <img
                      src={store.owner.avatar_url}
                      alt={store.owner.full_name ?? ""}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs text-zinc-400">
                        {store.owner?.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 truncate">
                    {store.owner?.full_name ?? "Unknown"}
                    {store.owner?.university && ` · ${store.owner.university}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="h-12" />
    </div>
  );
}