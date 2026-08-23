"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  last_message: string | null;
  last_message_at: string;
  participant_one: string;
  participant_two: string;
  participant_one_profile: Profile | Profile[] | null;
  participant_two_profile: Profile | Profile[] | null;
  listings ? : { id: string;title: string;images: string[] } | null;
}

function normalize < T > (val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
}

export default function ConversationList({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <MessageCircle className="h-12 w-12 text-zinc-700 mb-4" />
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">
          No conversations yet
        </h3>
        <p className="text-xs text-zinc-500 max-w-xs">
          When you buy or sell something, you can message the other party
          directly from your order.
        </p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-zinc-800">
      {conversations.map((convo) => {
        const p1 = normalize(convo.participant_one_profile);
        const p2 = normalize(convo.participant_two_profile);
        const other = convo.participant_one === currentUserId ? p2 : p1;
        const otherName = other?.full_name ?? "Unknown User";
        const otherAvatar = other?.avatar_url;
        const initials = otherName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const timeAgo = new Date(convo.last_message_at).toLocaleDateString(
          "en-NG",
          { day: "numeric", month: "short" }
        );

        return (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-900/50 transition-colors"
          >
            <div className="relative flex-shrink-0">
              {otherAvatar ? (
                <img
                  src={otherAvatar}
                  alt={otherName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900/50 text-sm font-semibold text-emerald-400">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100 truncate">
                  {otherName}
                </p>
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {timeAgo}
                </span>
              </div>
              {convo.listings && (
                <p className="text-xs text-emerald-500 truncate">
                  Re: {convo.listings.title}
                </p>
              )}
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {convo.last_message ?? "No messages yet"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}