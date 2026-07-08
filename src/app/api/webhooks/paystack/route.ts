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
  console.log("Processing event:", event.event, "data:", JSON.stringify(event.data).slice(0, 200));

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;
    console.log("Updating order for reference:", reference);

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("paystack_reference", reference)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error.message);
      return;
    }

    console.log("Order updated:", order?.id, "status:", order?.status);

    if (order) {
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
  }

  if (event.event === "transfer.success") {
    const transferCode = event.data.transfer_code as string;
    await supabase
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
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