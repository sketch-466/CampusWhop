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
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Process async — don't await, return 200 immediately
  processWebhookEvent(event).catch(console.error);

  return new Response("OK", { status: 200 });
}

async function processWebhookEvent(event: {
  event: string;
  data: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;
    
    // Update order to paid
    const { data: order } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("paystack_reference", reference)
      .select()
      .single();

    if (order) {
      // Check if digital product
      const { data: listing } = await supabase
        .from("listings")
        .select("product_type")
        .eq("id", order.listing_id)
        .single();

      if (listing?.product_type === "digital") {
        // Auto-complete digital orders
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
