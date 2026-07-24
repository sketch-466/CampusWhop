import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/lib/actions/analytics";
import AdminAnalyticsClient from "@/components/shared/admin-analytics-client";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const stats = await getAdminStats();

  return <AdminAnalyticsClient stats={stats} />;
}