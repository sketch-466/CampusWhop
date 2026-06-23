"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Gavel, Zap, Crown, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface LeaderboardTabsProps {
  topSellers: any[];
  topMediators: any[];
  topWhopcoins: any[];
  currentUserId: string;
}

export function LeaderboardTabs({
  topSellers,
  topMediators,
  topWhopcoins,
  currentUserId,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"sellers" | "mediators" | "whopcoins">("sellers");

  const tabs = [
    { id: "sellers" as const, label: "Top Sellers", icon: Trophy, data: topSellers, key: "reputation_score" },
    { id: "mediators" as const, label: "Top Mediators", icon: Gavel, data: topMediators, key: "mediation_cases_won" },
    { id: "whopcoins" as const, label: "WhopCoin Rich", icon: Zap, data: topWhopcoins, key: "whopcoins_balance" },
  ];

  const activeTabData = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon
              className={cn(
                "h-4 w-4",
                activeTab === tab.id ? "text-emerald-400" : ""
              )}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium - Top 3 */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[1, 0, 2].map((idx) => {
          const user = activeTabData.data[idx];
          if (!user) return <div key={idx} className="hidden sm:block" />;

          const isCurrentUser = user.id === currentUserId;
          const rank = idx + 1;
          const positions = [
            { height: "h-32", medal: "🥈", color: "from-slate-400/20 to-slate-600/20", border: "border-slate-500/20" },
            { height: "h-40", medal: "🥇", color: "from-amber-400/20 to-amber-600/20", border: "border-amber-500/20" },
            { height: "h-28", medal: "🥉", color: "from-orange-400/20 to-orange-700/20", border: "border-orange-500/20" },
          ];

          return (
            <div
              key={user.id}
              className={cn(
                "flex flex-col items-center justify-end rounded-xl border p-4 relative",
                positions[idx].color,
                positions[idx].border,
                isCurrentUser && "ring-2 ring-emerald-500/30"
              )}
            >
              <span className="text-2xl mb-2">{positions[idx].medal}</span>
              <div className="h-10 w-10 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-emerald-400">
                  {user.full_name?.charAt(0)}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground text-center line-clamp-1">
                {user.full_name}
              </p>
              <p className="text-xs text-emerald-400 font-bold mt-1">
                {user[activeTabData.key]?.toLocaleString()}
              </p>
              {isCurrentUser && (
                <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                  YOU
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Full List */}
      <div className="space-y-2">
        {activeTabData.data.slice(3).map((user, idx) => {
          const rank = idx + 4;
          const isCurrentUser = user.id === currentUserId;

          return (
            <Card
              key={user.id}
              className={cn(
                "border-border bg-card transition-all",
                isCurrentUser && "border-emerald-500/30 bg-emerald-500/5"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-6 text-center text-xs font-bold",
                      rank <= 10 ? "text-amber-400" : "text-muted-foreground"
                    )}
                  >
                    #{rank}
                  </span>

                  <div className="h-9 w-9 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-sm text-emerald-400">
                      {user.full_name?.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-sm font-medium text-foreground hover:text-emerald-400 transition-colors truncate"
                      >
                        {user.full_name}
                      </Link>
                      <VerificationBadge status="verified" size="sm" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {user.university}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      {user[activeTabData.key]?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {activeTab === "sellers" && "reputation"}
                      {activeTab === "mediators" && "cases won"}
                      {activeTab === "whopcoins" && "WHP"}
                    </p>
                  </div>

                  {isCurrentUser && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                      YOU
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
