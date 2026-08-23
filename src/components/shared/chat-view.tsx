"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
  sender: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  listing_id: string | null;
  listings?: {
    id: string;
    title: string;
    images: string[];
  } | null;
}

export default function ChatView({
  conversationId,
  initialMessages,
  conversation,
  currentUserId,
}: {
  conversationId: string;
  initialMessages: Message[];
  conversation: Conversation | null;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    setInput("");
    setError(undefined);

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if (result.error) {
        setError(result.error);
        setInput(trimmed);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const listing = conversation?.listings
    ? Array.isArray(conversation.listings)
      ? conversation.listings[0]
      : conversation.listings
    : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 flex-shrink-0">
        <Link href="/messages" className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Conversation</p>
          {listing && (
            <p className="text-xs text-emerald-500 truncate">
              Re: {listing.title}
            </p>
          )}
        </div>
        {listing && (
          <Link
            href={`/marketplace/${listing.id}`}
            className="flex-shrink-0 h-9 w-9 rounded-lg overflow-hidden border border-zinc-700"
          >
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-800" />
            )}
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-zinc-600">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const time = new Date(msg.created_at).toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMe ? "text-emerald-200" : "text-zinc-500"
                  }`}
                >
                  {time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none max-h-32"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-600 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}