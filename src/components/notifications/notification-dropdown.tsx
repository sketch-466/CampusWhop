"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ShoppingBag,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  Flame,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "sale" | "purchase" | "message" | "dispute" | "drop" | "verification" | "review";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock notifications - replace with real Supabase realtime subscription
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "sale",
        title: "Item Sold!",
        body: "Your CSC 101 textbook was purchased by Chioma N.",
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        link: "/trust/transactions",
      },
      {
        id: "2",
        type: "drop",
        title: "Campus Drop Starting",
        body: "A flash sale for iPhone 12 starts in 10 minutes!",
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        link: "/drops",
      },
      {
        id: "3",
        type: "verification",
        title: "Verified!",
        body: "Your student identity has been approved. You can now sell items.",
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        link: "/profile",
      },
      {
        id: "4",
        type: "review",
        title: "New Review",
        body: "Alex O. left you a 5-star review: 'Great seller, fast delivery!'",
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        link: "/profile",
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "sale":
      case "purchase":
        return { icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/10" };
      case "message":
        return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" };
      case "dispute":
        return { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" };
      case "drop":
        return { icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" };
      case "verification":
        return { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" };
      case "review":
        return { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" };
      default:
        return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const { icon: Icon, color, bg } = getIcon(notification.type);
                  return (
                    <Link
                      key={notification.id}
                      href={notification.link || "#"}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors",
                        !notification.read && "bg-emerald-500/[0.02]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          bg
                        )}
                      >
                        <Icon className={cn("h-4 w-4", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              !notification.read
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-center">
              <Link
                href="/notifications"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
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
  return `${days}d ago`;
}
