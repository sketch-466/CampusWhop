"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function FeatureCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!reference) {
        setError("No payment reference found.");
        setStatus("error");
        return;
      }

      try {
        const res = await fetch("/api/feature/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const result = await res.json();

        if (result.success) {
          setStatus("success");
        } else {
          setError(result.error || "Verification failed.");
          setStatus("error");
        }
      } catch {
        setError("Something went wrong. Contact support with ref: " + reference);
        setStatus("error");
      }
    }

    verify();
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Activating your featured listing...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Activation Failed</h1>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/marketplace")}
            className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl"
          >
            Go to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-2xl font-bold text-white mb-2">You're Featured!</h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Your listing is now pinned to the top of the marketplace and shown on the homepage.
        </p>
        <button
          onClick={() => router.push("/marketplace")}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition"
        >
          View Marketplace
        </button>
      </div>
    </div>
  );
}