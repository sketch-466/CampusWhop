"use client";

import { Bell, Menu, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

interface TopNavProps {
  user: User;
  profile: any;
  onMenuClick: () => void;
}

export function TopNav({ user, profile, onMenuClick }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block text-gradient">
              CampusWhop
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </Button>

          <Link href="/profile">
            <Avatar className="h-8 w-8 ring-2 ring-emerald-500/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-emerald-950 text-emerald-400 text-xs">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
