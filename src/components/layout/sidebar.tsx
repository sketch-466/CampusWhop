"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  BookOpen,
  Briefcase,
  Trophy,
  Shield,
  Sparkles,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  X,
  BadgeCheck,
  Store,
  GraduationCap,
  Wrench,
  Calendar,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  user: User;
  profile: any;
  onClose?: () => void;
}

const mainNav = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/digital_products", label: "Digital Store", icon: Store },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/jobs", label: "Campus Jobs", icon: Briefcase },
  { href: "/services", label: "Student Services", icon: Wrench },
  { href: "/events", label: "Campus Events", icon: Calendar },
  { href: "/drops", label: "Campus Drops", icon: Flame },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const createNav = [
  { href: "/sell", label: "Sell Something", icon: Store },
  { href: "/create-course", label: "Create Course", icon: GraduationCap },
  { href: "/offer-service", label: "Offer a Service", icon: Wrench },
  { href: "/create-event", label: "Host an Event", icon: Calendar },
];

const trustNav = [
  { href: "/trust", label: "Trust & Safety", icon: Shield },
  { href: "/trust/transactions", label: "My Transactions", icon: Wallet },
  { href: "/trust/disputes", label: "Disputes", icon: Shield },
  { href: "/trust/reviews", label: "My Reviews", icon: BadgeCheck },
];

const youNav = [
  { href: "/wallet", label: "Wallet & WhopCoins", icon: Wallet },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user, profile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const NavItem = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: any;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
          isActive
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 transition-colors",
            isActive ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {label}
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </Link>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="px-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 mt-6">
      {children}
    </h3>
  );

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gradient">CampusWhop</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User Card */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/profile" className="flex items-center gap-3 group">
          <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/50 transition-all">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-emerald-950 text-emerald-400">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || "Student"}
            </p>
            <div className="flex items-center gap-1.5">
              {profile?.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <p className="text-xs text-muted-foreground truncate">
                {profile?.is_verified ? "Verified" : "Unverified"}
              </p>
            </div>
          </div>
        </Link>
        {profile?.whopcoins_balance !== undefined && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {profile.whopcoins_balance.toLocaleString()} WhopCoins
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3">
        <SectionTitle>Discover</SectionTitle>
        <nav className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <SectionTitle>Create & Earn</SectionTitle>
        <nav className="space-y-0.5">
          {createNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <SectionTitle>Trust & Safety</SectionTitle>
        <nav className="space-y-0.5">
          {trustNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <SectionTitle>You</SectionTitle>
        <nav className="space-y-0.5">
          {youNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
