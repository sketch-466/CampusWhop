"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/novels";

export default function FollowButton({
  authorId,
  initialFollowing,
}: {
  authorId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleFollow(authorId);
      if (result.success) setFollowing(result.following ?? !following);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        following
          ? "border border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {following ? (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </button>
  );
}