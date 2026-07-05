import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminListingsClient } from "@/components/shared/admin-listings-client";

export default async function AdminListingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      profiles:seller_id (
        full_name,
        email
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return <AdminListingsClient initialListings={listings || []} />;
}