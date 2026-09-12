"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface Category {
  value: string;
  label: string;
}

interface MarketplaceFiltersProps {
  categories: Category[];
  activeCategory?: string;
  activeType?: string;
  activeSearch?: string;
  activeFiltersCount: number;
}

export function MarketplaceFilters({
  categories,
  activeCategory,
  activeType,
  activeSearch,
  activeFiltersCount,
}: MarketplaceFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch ?? "");
  const [isPending, startTransition] = useTransition();
  const [showCategories, setShowCategories] = useState(false);

  const buildUrl = useCallback(
    (overrides: {
      category?: string | null;
      type?: string | null;
      search?: string | null;
    }) => {
      const params = new URLSearchParams();
      const cat = "category" in overrides ? overrides.category : activeCategory;
      const type = "type" in overrides ? overrides.type : activeType;
      const q = "search" in overrides ? overrides.search : activeSearch;
      if (cat) params.set("category", cat);
      if (type) params.set("type", type);
      if (q) params.set("search", q);
      const qs = params.toString();
      return `/marketplace${qs ? `?${qs}` : ""}`;
    },
    [activeCategory, activeType, activeSearch]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        startTransition(() => {
          router.push(buildUrl({ search: value || null }));
        });
      }, 400);
      return () => clearTimeout(timeout);
    },
    [buildUrl, router]
  );

  const handleCategoryClick = (value: string) => {
    startTransition(() => {
      router.push(
        buildUrl({ category: activeCategory === value ? null : value })
      );
    });
  };

  const handleTypeClick = (value: string) => {
    startTransition(() => {
      router.push(
        buildUrl({ type: activeType === value ? null : value })
      );
    });
  };

  return (
    <div className="mb-6 space-y-3">

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search listings..."
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCategories((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            activeFiltersCount > 0
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable filters */}
      {showCategories && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">

          {/* Type filter */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Type</p>
            <div className="flex gap-2">
              {[
                { value: "physical", label: "🏷 Physical" },
                { value: "digital", label: "⚡ Digital" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTypeClick(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeType === t.value
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat.value
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear all */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                startTransition(() => router.push("/marketplace"));
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {(activeCategory || activeType) && (
        <div className="flex flex-wrap gap-2">
          {activeType && (
            <button
              onClick={() => handleTypeClick(activeType)}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              {activeType === "physical" ? "🏷 Physical" : "⚡ Digital"}
              <X className="h-3 w-3" />
            </button>
          )}
          {activeCategory && (
            <button
              onClick={() => handleCategoryClick(activeCategory)}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              {categories.find((c) => c.value === activeCategory)?.label ?? activeCategory}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}