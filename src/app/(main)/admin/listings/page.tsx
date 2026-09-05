import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const adminClient = createAdminClient();
  const { data: listings } = await adminClient
    .from("listings")
    .select(`*, profiles!listings_seller_id_fkey(full_name, email)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Pending Listings</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''} awaiting review.
        </p>
      </div>
      <AdminListingsClient initialListings={listings || []} />
    </div>
  );
}