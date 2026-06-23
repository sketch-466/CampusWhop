import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SellForm } from "@/components/sell/sell-form";

export default async function SellPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check verification
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (!profile?.is_verified) {
    redirect("/verify");
  }

  // Fetch user's courses for course-linked marketplace
  const { data: memberships } = await supabase
    .from("course_memberships")
    .select("course:courses(id, code, title)")
    .eq("user_id", user.id);

  const courses = memberships?.map((m: any) => m.course) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sell Something</h1>
        <p className="text-sm text-muted-foreground">
          List your item on the campus marketplace
        </p>
      </div>

      <SellForm userId={user.id} courses={courses} />
    </div>
  );
}
