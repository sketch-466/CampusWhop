"use client";

import { useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  MessageSquare,
  Star,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WalletDashboardProps {
  balance: number;
  reputation: number;
  transactions: any[];
}

const REWARDS_TIERS = [
  { name: "Bronze", min: 0, color: "text-amber-600", bg: "bg-amber-600/10" },
  { name: "Silver", min: 500, color: "text-slate-400", bg: "bg-slate-400/10" },
  { name: "Gold", min: 2000, color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Emerald", min: 5000, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Diamond", min: 10000, color: "text-cyan-400", bg: "bg-cyan-400/10" },
];

export function WalletDashboard({ balance, reputation, transactions }: WalletDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "rewards">("overview");

  const currentTier = [...REWARDS_TIERS].reverse().find((t) => balance >= t.min) || REWARDS_TIERS[0];
  const nextTier = REWARDS_TIERS.find((t) => t.min > balance);
  const progressToNext = nextTier
    ? ((balance - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const stats = [
    {
      label: "Total Earned",
      value: (balance + 2340).toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Spent",
      value: "2,340",
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Reputation",
      value: reputation.toString(),
      icon: Award,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Streak",
      value: "12 days",
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase_made":
        return { icon: ShoppingBag, color: "text-rose-400", bg: "bg-rose-500/10", label: "Purchase" };
      case "sale_made":
        return { icon: ArrowUpRight, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Sale" };
      case "review_received":
        return { icon: Star, color: "text-amber-400", bg: "bg-amber-500/10", label: "Review" };
      case "course_contribution":
        return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", label: "Course" };
      case "daily_streak":
        return { icon: Gift, color: "text-purple-400", bg: "bg-purple-500/10", label: "Streak" };
      default:
        return { icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Reward" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="pt-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">WhopCoins Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-400">
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm text-emerald-400/60">WHP</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ₦{(balance * 10).toLocaleString()} NGN value
              </p>
            </div>
            <div
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border",
                currentTier.bg,
                currentTier.color,
                "border-current/20"
              )}
            >
              {currentTier.name} Member
            </div>
          </div>

          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">
                  {nextTier.min - balance} more to {nextTier.name}
                </span>
                <span className="text-emerald-400">{Math.round(progressToNext)}%</span>
              </div>
              <Progress value={progressToNext} className="h-1.5 bg-muted" />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Earn More
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            >
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Redeem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="pt-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["overview", "history", "rewards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "history" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet. Start buying or selling!
              </div>
            ) : (
              transactions.map((tx: any) => {
                const { icon: Icon, color, bg, label } = getTransactionIcon(tx.event_type);
                const isPositive = tx.points > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {isPositive ? "+" : ""}
                      {tx.points} WHP
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "rewards" && (
        <div className="grid gap-3">
          {REWARDS_TIERS.map((tier, i) => {
            const isUnlocked = balance >= tier.min;
            const isCurrent = currentTier.name === tier.name;
            return (
              <Card
                key={tier.name}
                className={cn(
                  "border transition-all",
                  isCurrent
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isUnlocked
                    ? "border-border bg-card"
                    : "border-border/50 bg-muted/30 opacity-60"
                )}
              >
                <CardContent className="pt-4 flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2",
                      isUnlocked ? tier.bg : "bg-muted border-border",
                      isUnlocked ? "border-current" : ""
                    )}
                  >
                    <Award className={cn("h-5 w-5", isUnlocked ? tier.color : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("font-semibold", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                        {tier.name}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tier.min.toLocaleString()}+ WhopCoins required
                    </p>
                  </div>
                  {isUnlocked && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="grid gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                Daily Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">12 days</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Log in tomorrow to keep your streak alive and earn 50 bonus WhopCoins!
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        day <= 5
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {day <= 5 ? <CheckCircle className="h-3.5 w-3.5" /> : day}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-3 border-border hover:bg-emerald-500/5 hover:border-emerald-500/20 justify-start gap-3">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Sell Item</p>
                  <p className="text-[10px] text-muted-foreground">Earn 100+ WHP</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 border-border hover:bg-emerald-500/5 hover:border-emerald-500/20 justify-start gap-3">
                <Star className="h-4 w-4 text-amber-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Leave Review</p>
                  <p className="text-[10px] text-muted-foreground">Earn 10 WHP</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 border-border hover:bg-emerald-500/5 hover:border-emerald-500/20 justify-start gap-3">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Course Post</p>
                  <p className="text-[10px] text-muted-foreground">Earn 25 WHP</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-3 border-border hover:bg-emerald-500/5 hover:border-emerald-500/20 justify-start gap-3">
                <Gift className="h-4 w-4 text-purple-400" />
                <div className="text-left">
                  <p className="text-sm font-medium">Invite Friend</p>
                  <p className="text-[10px] text-muted-foreground">Earn 200 WHP</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
