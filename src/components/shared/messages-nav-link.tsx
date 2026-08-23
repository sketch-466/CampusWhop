"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getUnreadCount } from "@/lib/actions/messages";

export default function MessagesNavLink() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await getUnreadCount();
      setUnread(count);
    }
    fetchCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/messages"
      className="relative flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Messages</span>
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}