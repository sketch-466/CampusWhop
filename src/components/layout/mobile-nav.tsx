"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, BookOpen, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/marketplace", label: "Market", icon: ShoppingBag },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/90 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                isActive
                  ? "text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-8 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
