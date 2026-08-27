"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({
  listingId,
  title,
  referralCode,
}: {
  listingId: string;
  title: string;
  referralCode ? : string;
}) {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = `https://campuswhop.com/marketplace/${listingId}`;
  const shareUrl = referralCode ?
    `${baseUrl}?ref=${referralCode}` :
    baseUrl;
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} — CampusWhop`,
          text: `Check out this listing on CampusWhop: ${title}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <button
      onClick={handleShare}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
      title="Share listing"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}