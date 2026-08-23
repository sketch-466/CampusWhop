"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getOrCreateConversation } from "@/lib/actions/messages";

export default function MessageButton({
  otherUserId,
  listingId,
  orderId,
  label = "Message",
  className,
}: {
  otherUserId: string;
  listingId?: string;
  orderId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleClick = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await getOrCreateConversation(
        otherUserId,
        listingId,
        orderId
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/messages/${result.conversationId}`);
    });
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={
          className ??
          "flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
        }
      >
        <MessageCircle className="h-4 w-4" />
        {isPending ? "Opening..." : label}
      </button>
      {error && (
        <p className="text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}