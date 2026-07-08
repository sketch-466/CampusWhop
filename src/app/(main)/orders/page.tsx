import Link from "next/link";
import { getUserOrders, verifyPayment } from "@/lib/actions/orders";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  paid: "success",
  delivered: "success",
  completed: "success",
  disputed: "destructive",
  refunded: "default",
  cancelled: "default",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;

  const reference = params.reference || params.trxref;
  if (reference) {
    await verifyPayment(reference);
  }

  const { buying, selling, error } = await getUserOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-white">Orders</h1>

      {reference && (
        <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-900/20 p-3">
          <p className="text-sm text-emerald-400">
            ✓ Payment received — your order has been updated below.
          </p>
        </div>
      )}

      <Tabs defaultValue="buying" className="mt-6">
        <TabsList>
          <TabsTrigger value="buying">Buying</TabsTrigger>
          <TabsTrigger value="selling">Selling</TabsTrigger>
        </TabsList>

        <TabsContent value="buying">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : !buying || buying.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-400">No orders yet.</p>
              <Link href="/marketplace">
                <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buying.map((order: any) => (
                <OrderCard key={order.id} order={order} type="buying" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selling">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : !selling || selling.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-zinc-400">No sales yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selling.map((order: any) => (
                <OrderCard key={order.id} order={order} type="selling" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order, type }: { order: any; type: "buying" | "selling" }) {
  const initials =
    type === "selling" && order.buyer?.full_name
      ? order.buyer.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "B";

  const showConfirmDelivery =
    type === "buying" &&
    order.status === "paid" &&
    order.listing?.product_type === "physical";

  const showDispute =
    type === "buying" && ["paid", "delivered"].includes(order.status);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          {order.listing?.images && order.listing.images.length > 0 ? (
            <img
              src={order.listing.images[0]}
              alt={order.listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-5 w-5 text-zinc-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white truncate">
              {order.listing?.title || "Unknown Listing"}
            </h3>
            <Badge variant={statusColors[order.status] || "default"}>
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-emerald-500">
            ₦{order.amount.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">
            {new Date(order.created_at).toLocaleDateString()}
          </p>

          {type === "selling" && order.buyer && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-5 w-5">
                {order.buyer.avatar_url && (
                  <AvatarImage
                    src={order.buyer.avatar_url}
                    alt={order.buyer.full_name}
                  />
                )}
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-zinc-400">
                {order.buyer.full_name || "Unknown"}
              </span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {showConfirmDelivery && (
              <form
                action={async () => {
                  "use server";
                  const { confirmDelivery } = await import("@/lib/actions/orders");
                  await confirmDelivery(order.id);
                }}
              >
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Confirm Delivery
                </Button>
              </form>
            )}

            {showDispute && (
              <form
                action={async () => {
                  "use server";
                  const { disputeOrder } = await import("@/lib/actions/orders");
                  await disputeOrder(order.id, "Buyer initiated dispute");
                }}
              >
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="gap-1 text-red-400 hover:bg-red-900/20"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Dispute
                </Button>
              </form>
            )}

            {order.status === "completed" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400">✓ Completed</span>
                <Link href={`/reviews/${order.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                    Leave Review
                  </Button>
                </Link>
              </div>
            )}

            {order.status === "disputed" && (
              <span className="text-xs text-red-400">Under admin review</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
