import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const adminNav = [
  { label: "Listings", href: "/admin/listings" },
  { label: "Gigs", href: "/admin/jobs" },
  { label: "Stores", href: "/admin/stores" },
  { label: "Disputes", href: "/admin/disputes" },
  { label: "Opportunities", href: "/admin/opportunities" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Analytics", href: "/admin/analytics" },
]

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: disputes } = await supabase
    .from("orders")
    .select(`
      *,
      listing:listings(title, images),
      buyer:profiles!orders_buyer_id_fkey(full_name, email),
      seller:profiles!orders_seller_id_fkey(full_name, email)
    `)
    .eq("status", "disputed")
    .order("disputed_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Platform management</p>

      <div className="flex flex-wrap gap-2 mt-6 border-b border-zinc-800 pb-4">
        {adminNav.map((item) => (
          <Link key={item.href} href={item.href}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              item.href === "/admin/disputes"
                ? "bg-emerald-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {!disputes || disputes.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-400">No active disputes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute: any) => (
              <div key={dispute.id}
                className="rounded-xl border border-red-900/50 bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {dispute.listing?.title || "Unknown Listing"}
                    </h3>
                    <p className="text-emerald-400 text-sm mt-1">
                      ₦{dispute.amount?.toLocaleString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-zinc-400">
                        Buyer: {dispute.buyer?.full_name || "Unknown"} · {dispute.buyer?.email}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Seller: {dispute.seller?.full_name || "Unknown"} · {dispute.seller?.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Disputed: {dispute.disputed_at
                          ? new Date(dispute.disputed_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-400 shrink-0">
                    Disputed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}