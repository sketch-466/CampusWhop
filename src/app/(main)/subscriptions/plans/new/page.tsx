import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewPlanForm } from "@/components/shared/new-plan-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_type")
    .eq("id", user.id)
    .single();

  if (!profile?.creator_type) {
    redirect("/profile/edit");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href="/subscriptions"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subscriptions
      </Link>
      <h1 className="text-2xl font-bold text-white">Create Subscription Plan</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Offer a monthly plan to your audience. You receive 90% of every payment.
      </p>
      <NewPlanForm />
    </div>
  );
}