"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  GraduationCap,
  Calendar,
  ShoppingBag,
  Star,
  TrendingUp,
  Award,
  Edit3,
  Share2,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: any;
  user: any;
  stats: {
    listings: number;
    sales: number;
    purchases: number;
    reviews: number;
  };
}

export function ProfileCard({ profile, user, stats }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(`https://campus-whop-theta.vercel.app/profile/${user.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-emerald-950/50 via-emerald-900/30 to-emerald-950/50 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNTIsIDIxMSwgMTUzLCAwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-4">
          <Avatar className="h-24 w-24 ring-4 ring-background">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-emerald-950 text-emerald-400 text-2xl font-bold">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {profile?.full_name || "Campus Student"}
              </h1>
              <VerificationBadge
                status={profile?.is_verified ? "verified" : profile?.verification_status === "pending" ? "pending" : "unverified"}
                size="md"
                showLabel
              />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile?.username || user.email?.split("@")[0]}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:bg-muted"
              onClick={handleShare}
            >
              {copied ? (
                <BadgeCheck className="h-4 w-4 mr-1.5 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4 mr-1.5" />
              )}
              {copied ? "Copied" : "Share"}
            </Button>
            <Link href="/settings">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                <Edit3 className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Bio & Info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
          {profile?.university && (
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
              {profile.university}
            </span>
          )}
          {profile?.department && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {profile.department}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            Joined {memberSince}
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={ShoppingBag}
            value={stats.listings}
            label="Listings"
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.sales}
            label="Sales"
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Star}
            value={stats.reviews}
            label="Reviews"
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={Award}
            value={profile?.reputation_score || 0}
            label="Reputation"
            color="text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>

        {/* WhopCoins Badge */}
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {profile?.whopcoins_balance?.toLocaleString() || 0} WhopCoins
            </p>
            <p className="text-xs text-muted-foreground">
              Earn more by selling, reviewing, and staying active
            </p>
          </div>
          <Link href="/wallet">
            <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
              View Wallet
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  bg,
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
