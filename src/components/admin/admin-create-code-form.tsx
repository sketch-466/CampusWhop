"use client";

import { useState } from "react";
import { adminCreateCustomCode } from "@/lib/actions/referrals";

export function AdminCreateCodeForm() {
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [commissionRate, setCommissionRate] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState < { success ? : boolean;code ? : string;error ? : string } | null > (null);
  
  async function handleSubmit() {
    if (!userId || !code || !label) {
      setResult({ error: "All fields are required" });
      return;
    }
    setLoading(true);
    setResult(null);
    const res = await adminCreateCustomCode({
      userId,
      code,
      label,
      commissionRate: parseFloat(commissionRate),
    });
    setResult(res);
    if (res.success) {
      setUserId("");
      setCode("");
      setLabel("");
      setCommissionRate("5");
    }
    setLoading(false);
  }
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            User ID (from Supabase)
          </label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            Custom Code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="e.g. FUNAI_BUYERS"
            maxLength={20}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none font-mono uppercase"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            Label (who is this for)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. FUNAI Buy & Sell Admin — Kelvin"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            Commission Rate (%)
          </label>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            min="1"
            max="20"
            step="0.5"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-[10px] text-zinc-600 mt-1">
            Default is 5%. Group admins can get up to 10%.
          </p>
        </div>
      </div>

      {result?.error && (
        <p className="text-xs text-red-400">{result.error}</p>
      )}
      {result?.success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400 font-medium">
            ✓ Code created: <span className="font-mono">{result.code}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Share link: campuswhop.com/register?ref={result.code}
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating..." : "Create Code"}
      </button>
    </div>
  );
}