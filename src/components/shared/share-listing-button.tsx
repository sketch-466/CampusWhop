"use client";

import { useState } from "react";
import { Share2, Copy, Check, X, MessageCircle } from "lucide-react";

interface ShareListingButtonProps {
  title: string;
  price: number;
  description: string;
  id: string;
}

export function ShareListingButton({
  title,
  price,
  description,
  id,
}: ShareListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `https://campuswhop.com/marketplace/${id}`;

  // Trim description to 200 chars to keep caption clean
  const shortDescription =
    description.length > 200
      ? description.slice(0, 200).trim() + "..."
      : description;

  const caption =
    `🛍️ *${title}* — ₦${price.toLocaleString()}\n\n` +
    `${shortDescription}\n\n` +
    `👉 ${url}\n\n` +
    `_Listed on CampusWhop — The Campus Economy_`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(caption)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older Android browsers
      const el = document.createElement("textarea");
      el.value = caption;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* Share button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
      >
        <Share2 className="h-4 w-4" />
        Share Listing
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg rounded-t-2xl border-t border-zinc-800 bg-zinc-950 px-4 pb-8 pt-4 animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Share this listing</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Caption preview */}
            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide font-medium">
                Caption Preview
              </p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {caption}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* WhatsApp direct share */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>

              {/* Copy caption */}
              <button
                onClick={handleCopy}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-medium transition-colors ${
                  copied
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Caption
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-zinc-600">
              Share in WhatsApp groups to get more buyers
            </p>
          </div>
        </div>
      )}
    </>
  );
}