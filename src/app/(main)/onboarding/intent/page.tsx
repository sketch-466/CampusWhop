import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const INTENTS = [
  {
    value: "earn",
    emoji: "💰",
    label: "I want to make money",
    description: "Sell services, take bookings, run subscriptions",
  },
  {
    value: "work",
    emoji: "💼",
    label: "I want to find a job or gig",
    description: "Browse freelance work and paid opportunities",
  },
  {
    value: "sell",
    emoji: "🛍️",
    label: "I want to sell a product",
    description: "List physical or digital products on the marketplace",
  },
  {
    value: "hire",
    emoji: "🤝",
    label: "I want to hire someone",
    description: "Find talented student creators for your project",
  },
  {
    value: "opportunities",
    emoji: "🎯",
    label: "I want to find opportunities",
    description: "Discover scholarships, grants, and internships",
  },
] as const;

type IntentValue = (typeof INTENTS)[number]["value"];

const DESTINATIONS: Record<IntentValue, string> = {
  earn: "/creator-dashboard",
  work: "/gigs",
  sell: "/marketplace/new",
  hire: "/creators",
  opportunities: "/opportunities",
};

export default async function IntentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  async function selectIntent(formData: FormData) {
    "use server";
    const intent = formData.get("intent") as IntentValue;

    // Get user identity from regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Use admin client to bypass RLS for the update
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("profiles")
      .update({
        onboarding_intent: intent,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("selectIntent update failed:", error.message);
      redirect("/onboarding/intent");
    }

    revalidatePath("/", "layout");
    const destination = DESTINATIONS[intent] ?? "/dashboard";
    redirect(destination);
  }

  async function skipIntent() {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("skipIntent update failed:", error.message);
      redirect("/onboarding/intent");
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
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
            <form key={intent.value} action={selectIntent}>
              <input type="hidden" name="intent" value={intent.value} />
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-900/60"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{intent.emoji}</span>
                  <div>
                    <p className="font-semibold text-white">{intent.label}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {intent.description}
                    </p>
                  </div>
                </div>
              </button>
            </form>
          ))}
        </div>

        <div className="mt-6 text-center">
          <form action={skipIntent}>
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip for now → go to dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}