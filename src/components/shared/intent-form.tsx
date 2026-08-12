"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTENTS = [
  {
    value: "earn",
    emoji: "💰",
    label: "I want to make money",
    description: "Sell services, take bookings, run subscriptions",
    destination: "/profile/edit",
  },
  {
    value: "work",
    emoji: "💼",
    label: "I want to find a job or gig",
    description: "Browse freelance work and paid opportunities",
    destination: "/gigs",
  },
  {
    value: "sell",
    emoji: "🛍️",
    label: "I want to sell a product",
    description: "List physical or digital products on the marketplace",
    destination: "/marketplace/new",
  },
  {
    value: "hire",
    emoji: "🤝",
    label: "I want to hire someone",
    description: "Find talented student creators for your project",
    destination: "/creators",
  },
  {
    value: "opportunities",
    emoji: "🎯",
    label: "I want to find opportunities",
    description: "Discover scholarships, grants, and internships",
    destination: "/opportunities",
  },
] as const;

type IntentValue = (typeof INTENTS)[number]["value"];

interface IntentFormProps {
  fullName: string;
}

export function IntentForm({ fullName }: IntentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<IntentValue | null>(null);
  const [error, setError] = useState<string>();
  const [userId, setUserId] = useState<string | null>(null);

  const firstName = fullName.split(" ")[0] || "there";

  // Get user ID once on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const handleSelect = (intent: (typeof INTENTS)[number]) => {
    if (!userId) {
      setError("Session expired. Please refresh the page.");
      return;
    }

    setSelected(intent.value);
    setError(undefined);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_intent: intent.value,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        setError("Something went wrong. Please try again.");
        setSelected(null);
        return;
      }

      router.push(intent.destination);
    });
  };

  const handleSkip = () => {
    if (!userId) {
      router.push("/dashboard");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      router.push("/dashboard");
    });
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">
          Welcome, {firstName}! 👋
        </h1>
        <p className="mt-2 text-zinc-400">
          What brings you to CampusWhop?
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll personalise your experience based on what you want to do.
        </p>
      </div>

      <div className="space-y-3">
        {INTENTS.map((intent) => (
          <button
            key={intent.value}
            onClick={() => handleSelect(intent)}
            disabled={isPending || !userId}
            className={`w-full rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
              selected === intent.value
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900/60"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{intent.emoji}</span>
              <div>
                <p className="font-semibold text-white">{intent.label}</p>
                <p className="mt-0.5 text-sm text-zinc-400">
                  {intent.description}
                </p>
              </div>
              {selected === intent.value && (
                <span className="ml-auto text-emerald-400 shrink-0">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400">{error}</p>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
        >
          Skip for now → go to dashboard
        </button>
      </div>
    </div>
  );
}