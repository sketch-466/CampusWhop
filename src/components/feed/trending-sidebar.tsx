import { TrendingUp, Flame, Trophy, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const trendingTopics = [
  { tag: "#CSC101", posts: 234, trend: "up" },
  { tag: "#TextbookSales", posts: 189, trend: "up" },
  { tag: "#CampusDrops", posts: 156, trend: "up" },
  { tag: "#Tutoring", posts: 98, trend: "down" },
  { tag: "#FreshersWeek", posts: 87, trend: "up" },
];

const topSellers = [
  { name: "Alex O.", sales: 47, avatar: "" },
  { name: "Chioma N.", sales: 38, avatar: "" },
  { name: "Tunde B.", sales: 31, avatar: "" },
];

export function TrendingSidebar() {
  return (
    <div className="space-y-4">
      {/* Trending */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">Trending on Campus</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((topic, i) => (
            <Link
              key={topic.tag}
              href={`/search?q=${topic.tag}`}
              className="flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">
                  {topic.tag}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topic.posts} posts
                </p>
              </div>
              <ArrowUpRight
                className={cn(
                  "h-4 w-4 transition-colors",
                  topic.trend === "up" ? "text-emerald-400" : "text-muted-foreground"
                )}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Top Sellers */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Top Campus Sellers</h3>
        </div>
        <div className="space-y-3">
          {topSellers.map((seller, i) => (
            <div key={seller.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400 w-4">#{i + 1}</span>
              <div className="h-8 w-8 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-medium text-emerald-400">
                  {seller.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{seller.name}</p>
                <p className="text-xs text-muted-foreground">{seller.sales} sales</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Drops */}
      <div className="glass rounded-xl p-4 border-rose-500/10">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Live Drops</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          3 active flash sales happening right now
        </p>
        <Link href="/drops">
          <button className="w-full py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors">
            View All Drops
          </button>
        </Link>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
