import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VerificationReviewPanel } from "@/components/admin/verification-review-panel";
import { ShieldCheck } from "lucide-react";

export default async function AdminVerifyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/feed");
  }

  // Fetch pending verifications
  const { data: pending } = await supabase
    .from("verification_requests")
    .select(`
      *,
      user:profiles(id, full_name, avatar_url, email, university, department, matric_number)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch review history
  const { data: history } = await supabase
    .from("verification_requests")
    .select(`
      *,
      user:profiles(id, full_name, avatar_url, email),
      reviewed_by_user:profiles!verification_requests_reviewed_by_fkey(full_name)
    `)
    .neq("status", "pending")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            Verification Review
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and approve student identity verifications
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium text-amber-400">
            {pending?.length || 0} pending
          </span>
        </div>
      </div>

      <VerificationReviewPanel
        pending={pending || []}
        history={history || []}
        adminId={user.id}
      />
    </div>
  );
}
