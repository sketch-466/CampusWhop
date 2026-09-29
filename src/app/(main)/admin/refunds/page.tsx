import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import MarkRefundCompleteForm from "@/components/admin/mark-refund-complete-form";

const REFUND_STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed:     "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminRefundsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin =
    ["admin", "super_admin"].includes(profile?.role ?? "") ||
    profile?.is_admin === true;

  if (!isAdmin) redirect("/dashboard");

  const adminClient = createAdminClient();

  const { data: refunds } = await adminClient
    .from("orders")
    .select(`
      id, amount, refund_status, refund_amount,
      refund_reference, refunded_at, updated_at,
      paystack_reference,
      listings!orders_listing_id_fkey(title, images),
      store_products!orders_store_product_id_fkey(title, images),
      buyer:profiles!orders_buyer_id_fkey(id, full_name, email),
      seller:profiles!orders_seller_id_fkey(id, full_name, email),
      disputes(id, reason, resolution, resolution_notes)
    `)
    .not("refund_status", "is", null)
    .order("updated_at", { ascending: false });

  const pending    = refunds?.filter(r => r.refund_status === "pending")    ?? [];
  const processing = refunds?.filter(r => r.refund_status === "processing") ?? [];
  const completed  = refunds?.filter(r => r.refund_status === "completed")  ?? [];
  const failed     = refunds?.filter(r => r.refund_status === "failed")     ?? [];

  const totalPendingAmount = pending.reduce(
    (sum, r) => sum + (r.refund_amount ?? r.amount ?? 0), 0
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Refund Queue</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {pending.length} pending · {processing.length} processing · {completed.length} completed
        </p>
      </div>

      {/* Summary */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-yellow-800/30 bg-yellow-900/10 p-4">
          <p className="text-xs text-yellow-400 font-semibold mb-1">
            Action Required
          </p>
          <p className="text-sm text-zinc-300">
            {pending.length} refund{pending.length !== 1 ? 's' : ''} pending —
            total{' '}
            <span className="font-bold text-yellow-400">
              ₦{totalPendingAmount.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Process these manually via the Paystack dashboard, then mark each as complete below.
          </p>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
            Pending — Process Now
          </h3>
          {pending.map((order: any) => (
            <RefundCard key={order.id} order={order} showForm />
          ))}
        </section>
      )}

      {/* Processing */}
      {processing.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Processing
          </h3>
          {processing.map((order: any) => (
            <RefundCard key={order.id} order={order} showForm />
          ))}
        </section>
      )}

      {/* Failed */}
      {failed.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Failed — Needs Attention
          </h3>
          {failed.map((order: any) => (
            <RefundCard key={order.id} order={order} showForm />
          ))}
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Completed
          </h3>
          {completed.map((order: any) => (
            <RefundCard key={order.id} order={order} showForm={false} />
          ))}
        </section>
      )}

      {/* Empty */}
      {(!refunds || refunds.length === 0) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No refunds yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Refunds appear here when disputes are resolved with a refund outcome.
          </p>
        </div>
      )}

    </div>
  );
}

function RefundCard({
  order,
  showForm,
}: {
  order: any;
  showForm: boolean;
}) {
  const buyer  = Array.isArray(order.buyer)  ? order.buyer[0]  : order.buyer;
  const seller = Array.isArray(order.seller) ? order.seller[0] : order.seller;
  const dispute = Array.isArray(order.disputes)
    ? order.disputes[0]
    : order.disputes;

  const productTitle =
    order.listings?.title ??
    order.store_products?.title ??
    "Unknown Product";

  const productImage =
    order.listings?.images?.[0] ??
    order.store_products?.images?.[0] ??
    null;

  const refundAmount = order.refund_amount ?? order.amount;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <div className="p-4 space-y-3">

        {/* Product + status */}
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800 overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={productTitle}
                className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {productTitle}
              </p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                REFUND_STATUS_STYLES[order.refund_status]
              }`}>
                {order.refund_status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              Order: {order.paystack_reference ?? order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Amounts */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Order amount</span>
            <span className="text-zinc-300">₦{order.amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Refund amount</span>
            <span className="text-yellow-400 font-semibold">
              ₦{refundAmount?.toLocaleString()}
            </span>
          </div>
          {order.refund_reference && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Paystack ref</span>
              <span className="text-zinc-400 font-mono">{order.refund_reference}</span>
            </div>
          )}
          {order.refunded_at && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Completed</span>
              <span className="text-zinc-400">{formatDate(order.refunded_at)}</span>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">Buyer (refund to)</p>
            <p className="text-xs font-medium text-zinc-200">{buyer?.full_name ?? "—"}</p>
            <p className="text-[10px] text-zinc-500 truncate">{buyer?.email ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">Seller</p>
            <p className="text-xs font-medium text-zinc-200">{seller?.full_name ?? "—"}</p>
            <p className="text-[10px] text-zinc-500 truncate">{seller?.email ?? "—"}</p>
          </div>
        </div>

        {/* Dispute context */}
        {dispute && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 space-y-1">
            <p className="text-[10px] text-zinc-500 mb-0.5">Dispute context</p>
            <p className="text-xs text-zinc-400">
              Resolution: {dispute.resolution?.replace("_", " ") ?? "—"}
            </p>
            {dispute.resolution_notes && (
              <p className="text-xs text-zinc-500">{dispute.resolution_notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Mark complete form */}
      {showForm && (
        <MarkRefundCompleteForm
          orderId={order.id}
          refundAmount={refundAmount}
        />
      )}
    </div>
  );
}