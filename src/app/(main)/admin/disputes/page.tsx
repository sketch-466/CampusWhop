import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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

  const adminClient = createAdminClient();
  const { data: disputes } = await adminClient
    .from("orders")
    .select(`
      *,
      listing:listings!orders_listing_id_fkey(title, images),
      buyer:profiles!orders_buyer_id_fkey(full_name, email),
      seller:profiles!orders_seller_id_fkey(full_name, email)
    `)
    .eq("status", "disputed")
    .order("disputed_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Active Disputes</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {disputes?.length ?? 0} dispute{disputes?.length !== 1 ? 's' : ''} requiring attention.
        </p>
      </div>

      {!disputes || disputes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No active disputes.</p>
          <p className="text-xs text-zinc-500 mt-1">All orders are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute: any) => (
            <div key={dispute.id}
              className="rounded-xl border border-red-900/40 bg-zinc-900/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {dispute.listing?.title || "Unknown Listing"}
                    </h3>
                    <span className="rounded-full bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400">
                      Disputed
                    </span>
                  </div>
                  <p className="text-emerald-400 text-sm font-bold mt-1">
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
                        ? new Date(dispute.disputed_at).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : "Unknown"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      Order ref: {dispute.paystack_reference || dispute.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}