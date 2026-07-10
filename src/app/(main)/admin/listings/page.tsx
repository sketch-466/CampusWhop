import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Manage listings, jobs, and disputes</p>

      {/* Admin Navigation */}
      <div className="flex gap-3 mt-6 border-b border-zinc-800 pb-4">
        <Link
          href="/admin/listings"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Listings
        </Link>
        <Link
          href="/admin/jobs"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Jobs
        </Link>
        <Link
          href="/admin/disputes"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Disputes
        </Link>
      </div>

      <div className="mt-6">
        <AdminListingsClient initialListings={listings || []} />
      </div>
    </div>
  );
}