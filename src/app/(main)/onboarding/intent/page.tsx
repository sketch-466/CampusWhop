import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IntentForm } from "@/components/shared/intent-form";

export default async function IntentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  // If they already finished onboarding fully, skip
  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <IntentForm fullName={profile?.full_name || ""} />
    </div>
  );
}