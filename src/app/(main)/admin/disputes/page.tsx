import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ResolveDisputeForm from "@/components/admin/resolve-dispute-form";

const REASON_LABELS: Record<string, string> = {
  item_not_received: "Item not received",
  item_not_as_described: "Item not as described",
  seller_unresponsive: "Seller unresponsive",
  wrong_item: "Wrong item delivered",
  damaged_item: "Item arrived damaged",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/10 text-red-400 border-red-500/20",
  under_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminDisputesPage() {
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

  const { data: disputes } = await adminClient
    .from("disputes")
    .select(`
      *,
      order:orders!disputes_order_id_fkey(
        id, amount, platform_fee, seller_amount,
        status, paystack_reference,
        listing:listings!orders_listing_id_fkey(title, images),
        store_product:store_products!orders_store_product_id_fkey(title, images)
      ),
      buyer:profiles!disputes_buyer_id_fkey(id, full_name, email),
      seller:profiles!disputes_seller_id_fkey(id, full_name, email),
      resolver:profiles!disputes_resolved_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  const open = disputes?.filter(d => d.status === "open") ?? [];
  const under_review = disputes?.filter(d => d.status === "under_review") ?? [];
  const resolved = disputes?.filter(d => d.status === "resolved") ?? [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Disputes</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {open.length} open · {under_review.length} under review · {resolved.length} resolved
        </p>
      </div>

      {/* Open Disputes */}
      {open.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Open — Needs Attention
          </h3>
          {open.map((dispute: any) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              showResolveForm
            />
          ))}
        </section>
      )}

      {/* Under Review */}
      {under_review.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
            Under Review
          </h3>
          {under_review.map((dispute: any) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              showResolveForm
            />
          ))}
        </section>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Resolved
          </h3>
          {resolved.map((dispute: any) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              showResolveForm={false}
            />
          ))}
        </section>
      )}

      {/* Empty */}
      {!disputes || disputes.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No disputes yet.</p>
          <p className="text-xs text-zinc-500 mt-1">All orders are running smoothly.</p>
        </div>
      )}
    </div>
  );
}

function DisputeCard({
  dispute,
  showResolveForm,
}: {
  dispute: any;
  showResolveForm: boolean;
}) {
  const order = Array.isArray(dispute.order) ? dispute.order[0] : dispute.order;
  const buyer = Array.isArray(dispute.buyer) ? dispute.buyer[0] : dispute.buyer;
  const seller = Array.isArray(dispute.seller) ? dispute.seller[0] : dispute.seller;
  const resolver = Array.isArray(dispute.resolver) ? dispute.resolver[0] : dispute.resolver;

  const productTitle =
    order?.listing?.title ??
    order?.store_product?.title ??
    "Unknown Product";

  const productImage =
    order?.listing?.images?.[0] ??
    order?.store_product?.images?.[0] ??
    null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">

      {/* Top row */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {/* Product image */}
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
                STATUS_STYLES[dispute.status]
              }`}>
                {dispute.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">
              ₦{order?.amount?.toLocaleString() ?? "—"}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Opened {formatDate(dispute.created_at)}
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">Buyer</p>
            <p className="text-xs font-medium text-zinc-200">{buyer?.full_name ?? "—"}</p>
            <p className="text-[10px] text-zinc-500 truncate">{buyer?.email ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">Seller</p>
            <p className="text-xs font-medium text-zinc-200">{seller?.full_name ?? "—"}</p>
            <p className="text-[10px] text-zinc-500 truncate">{seller?.email ?? "—"}</p>
          </div>
        </div>

        {/* Dispute details */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-zinc-500">Reason:</p>
            <p className="text-xs font-medium text-zinc-300">
              {REASON_LABELS[dispute.reason] ?? dispute.reason}
            </p>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {dispute.description}
          </p>
        </div>

        {/* Payment summary */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 space-y-1">
          <p className="text-[10px] text-zinc-500 mb-1">Payment</p>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Order amount</span>
            <span className="text-zinc-300">₦{order?.amount?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Platform fee</span>
            <span className="text-zinc-300">₦{order?.platform_fee?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Seller amount</span>
            <span className="text-zinc-300">₦{order?.seller_amount?.toLocaleString() ?? "—"}</span>
          </div>
          {order?.paystack_reference && (
            <p className="text-[10px] text-zinc-600 font-mono pt-1">
              {order.paystack_reference}
            </p>
          )}
        </div>

        {/* Resolution details (if resolved) */}
        {dispute.status === "resolved" && (
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/10 px-3 py-2 space-y-1">
            <p className="text-[10px] text-emerald-400 font-semibold mb-1">Resolution</p>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Outcome</span>
              <span className="text-zinc-300">
                {dispute.resolution?.replace("_", " ") ?? "—"}
              </span>
            </div>
            {dispute.refund_amount && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Refund amount</span>
                <span className="text-zinc-300">₦{dispute.refund_amount.toLocaleString()}</span>
              </div>
            )}
            {dispute.resolution_notes && (
              <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                {dispute.resolution_notes}
              </p>
            )}
            {resolver && (
              <p className="text-[10px] text-zinc-600">
                Resolved by {resolver.full_name} · {formatDate(dispute.resolved_at)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resolve form */}
      {showResolveForm && (
        <ResolveDisputeForm
          disputeId={dispute.id}
          orderAmount={order?.amount ?? 0}
        />
      )}
    </div>
  );
}