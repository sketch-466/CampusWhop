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

    // Marketplace order — auto-complete digital products
    if (order.listing_id && !order.store_product_id) {
      const { data: listing } = await supabase
        .from("listings")
        .select("product_type")
        .eq("id", order.listing_id)
        .single();

      if (listing?.product_type === "digital") {
        await supabase
          .from("orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      }
    }

    // Store order
    if (order.store_product_id) {
      if (order.digital_file_url) {
        // Digital — complete immediately
        await supabase
          .from("orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      } else {
        // Physical — decrement stock + increment units_sold
        const { data: product } = await supabase
          .from("store_products")
          .select("stock_quantity")
          .eq("id", order.store_product_id)
          .single();

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