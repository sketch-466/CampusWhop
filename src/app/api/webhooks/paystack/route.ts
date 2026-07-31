import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    console.error("Webhook signature mismatch", {
      received: signature,
      expected: hash.slice(0, 10) + "...",
    });
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  console.log("Webhook event received:", event.event);

  processWebhookEvent(event).catch((err) => {
    console.error("Webhook processing error:", err);
  });

  return new Response("OK", { status: 200 });
}

async function processWebhookEvent(event: {
  event: string;
  data: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;
    console.log("Processing charge.success for reference:", reference);

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("paystack_reference", reference)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error.message);
      return;
    }

    if (!order) return;

    // ── MARKETPLACE ORDER ──
    if (order.listing_id && !order.store_product_id) {
      const { data: listing } = await supabase
        .from("listings")
        .select("product_type, digital_file_url")
        .eq("id", order.listing_id)
        .single();

      if (listing?.product_type === "digital") {
        await supabase
          .from("orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            // Copy file URL from listing into order so buyer can download
            digital_file_url: listing.digital_file_url ?? null,
          })
          .eq("id", order.id);
      }
    }

    // ── STORE ORDER ──
    if (order.store_product_id) {
      const { data: product } = await supabase
        .from("store_products")
        .select("product_type, digital_file_url, stock_quantity")
        .eq("id", order.store_product_id)
        .single();

      if (product?.product_type === "digital") {
        // Complete immediately and copy file URL
        await supabase
          .from("orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            digital_file_url: product.digital_file_url ?? null,
          })
          .eq("id", order.id);

        await supabase.rpc("increment_store_units_sold", {
          product_id: order.store_product_id,
        });
      } else {
        // Physical — decrement stock + increment units_sold
        if (
          product?.stock_quantity !== null &&
          product?.stock_quantity !== undefined
        ) {
          await supabase
            .from("store_products")
            .update({
              stock_quantity: Math.max(0, product.stock_quantity - 1),
            })
            .eq("id", order.store_product_id);
        }

        await supabase.rpc("increment_store_units_sold", {
          product_id: order.store_product_id,
        });
      }
    }
  }

  if (event.event === "transfer.success") {
    const transferCode = event.data.transfer_code as string;
    await supabase
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("paystack_transfer_code", transferCode);
  }

  if (event.event === "transfer.failed") {
    const transferCode = event.data.transfer_code as string;
    await supabase
      .from("orders")
      .update({ status: "disputed" })
      .eq("paystack_transfer_code", transferCode);
  }
}