"use client";

import { useState } from "react";
import { Copy, Check, Users, Gift, Clock } from "lucide-react";

interface Referral {
  id: string;
  status: string;
  reward_amount: number;
  created_at: string;
  rewarded_at: string | null;
  referred: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ReferralDashboard({
  code,
  referrals,
  totalEarned,
  pendingEarnings,
}: {
  code: string;
  referrals: Referral[];
  totalEarned: number;
  pendingEarnings: number;
}) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `https://campuswhop.com/register?ref=${code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
  const text = encodeURIComponent(
    `🛍️ *CampusWhop — The FUNAI Campus Marketplace*\n\n` +
    `Buy and sell safely with escrow payments. No more getting scammed.\n\n` +
    `✅ Verified student listings\n` +
    `🔒 Escrow payment protection\n` +
    `📦 Physical & digital products\n` +
    `💼 Gigs, internships & opportunities\n\n` +
    `Sign up free 👇\n${referralUrl}`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
};

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <h1 className="text-lg font-bold text-zinc-100">Refer & Earn</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Earn 5% of every purchase your referrals make
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
            <Users className="h-5 w-5 text-zinc-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{referrals.length}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Referred</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <Gift className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-emerald-400">
              ₦{totalEarned.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Earned</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-amber-400">
              ₦{pendingEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Pending</p>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">How it works</h2>
          <div className="space-y-2">
            {[
              { step: "1", text: "Share your referral link with friends" },
              { step: "2", text: "They sign up using your link" },
              { step: "3", text: "When they complete a purchase, you earn 5%" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {item.step}
                </div>
                <p className="text-xs text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 pt-1">
            Rewards are tracked automatically. Payouts will be available once
            the wallet feature launches.
          </p>
        </div>

        {/* Referral link */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Your referral link</h2>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
            <p className="flex-1 text-xs text-zinc-400 truncate">{referralUrl}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20c05c] transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </button>
        </div>

        {/* Referrals list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">
            Your referrals
            <span className="ml-2 text-xs font-normal text-zinc-500">
              ({referrals.length})
            </span>
          </h2>

          {referrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">No referrals yet.</p>
              <p className="text-xs text-zinc-600 mt-1">
                Share your link to start earning.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => {
                const name = r.referred?.full_name ?? "Unknown User";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(r.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.status === "rewarded" ? (
                        <>
                          <p className="text-sm font-bold text-emerald-400">
                            +₦{r.reward_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-600">Earned</p>
                        </>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}