"use client";

import Link from "next/link";
import { Heart, MessageCircle, Share2, Zap, Clock, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  post: {
    id: string;
    author: {
      id: string;
      full_name: string;
      avatar_url: string;
      is_verified: boolean;
      university?: string;
    };
    content: string;
    image_url?: string;
    type: "listing" | "course_post" | "announcement" | "drop";
    metadata?: {
      price?: number;
      course_code?: string;
      drop_time?: string;
      quantity?: number;
      location?: string;
    };
    likes_count: number;
    comments_count: number;
    created_at: string;
  };
}

export function FeedCard({ post }: FeedCardProps) {
  const typeConfig = {
    listing: {
      badge: "For Sale",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    course_post: {
      badge: "Course Update",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    announcement: {
      badge: "Announcement",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    drop: {
      badge: "Campus Drop",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse-glow",
    },
  };

  const config = typeConfig[post.type];

  return (
    <div className="glass rounded-xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.id}`}>
            <Avatar className="h-10 w-10 ring-2 ring-emerald-500/10">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback className="bg-emerald-950 text-emerald-400 text-sm">
                {post.author.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.id}`}
                className="text-sm font-medium text-foreground hover:text-emerald-400 transition-colors"
              >
                {post.author.full_name}
              </Link>
              <VerificationBadge
                status={post.author.is_verified ? "verified" : "unverified"}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{post.author.university || "Campus Student"}</span>
              <span>·</span>
              <span>{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-1 rounded-full border",
            config.badgeColor
          )}
        >
          {config.badge}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Metadata Bar */}
      {post.metadata && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.metadata.price && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">
                ₦{post.metadata.price.toLocaleString()}
              </span>
            </div>
          )}
          {post.metadata.course_code && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <span className="text-xs font-medium text-blue-400">
                {post.metadata.course_code}
              </span>
            </div>
          )}
          {post.metadata.drop_time && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/5 border border-rose-500/10">
              <Clock className="h-3 w-3 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">
                Drops {formatTimeAgo(post.metadata.drop_time)}
              </span>
            </div>
          )}
          {post.metadata.location && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {post.metadata.location}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10">
            <Heart className="h-4 w-4" />
            <span className="text-xs">{post.likes_count}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{post.comments_count}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
