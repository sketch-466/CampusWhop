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

  if (event.event === "subscription.create") {
    const sub = event.data as any;
    const planCode = sub.plan?.plan_code;
    const subscriptionCode = sub.subscription_code;
    const emailToken = sub.email_token;
    const customerEmail = sub.customer?.email;

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, creator_id")
      .eq("paystack_plan_code", planCode)
      .single();

    if (!plan) return;

    const { data: subscriber } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (!subscriber) return;

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await supabase.from("subscriptions").upsert(
      {
        plan_id: plan.id,
        subscriber_id: subscriber.id,
        creator_id: plan.creator_id,
        paystack_subscription_code: subscriptionCode,
        paystack_email_token: emailToken,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "paystack_subscription_code" }
    );
  }

  if (event.event === "invoice.payment_failed") {
    const sub = event.data as any;
    const subscriptionCode = sub.subscription?.subscription_code;
    if (!subscriptionCode) return;

    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("paystack_subscription_code", subscriptionCode);
  }

  if (event.event === "subscription.disable") {
    const sub = event.data as any;
    const subscriptionCode = sub.subscription_code;
    if (!subscriptionCode) return;

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("paystack_subscription_code", subscriptionCode);
  }
}