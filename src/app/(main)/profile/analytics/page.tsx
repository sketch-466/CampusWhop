import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentStats } from "@/lib/actions/analytics";
import StudentAnalyticsClient from "@/components/shared/student-analytics-client";

export default async function StudentAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stats = await getStudentStats(user.id);

  return <StudentAnalyticsClient stats={stats} />;
}