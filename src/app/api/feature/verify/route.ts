import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLAN_AMOUNTS: Record<string, number> = {
  "3": 50000,
  "7": 100000,
  "14": 180000,
  "30": 300000,
};

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference." }, { status: 400 });
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not confirmed by Paystack." }, { status: 402 });
    }

    // Extract metadata from Paystack response
    const { product_id, product_type, days } = paystackData.data.metadata;

    if (!product_id || !product_type || !days) {
      return NextResponse.json({ success: false, error: "Invalid payment metadata." }, { status: 400 });
    }

    const expectedKobo = PLAN_AMOUNTS[String(days)];
    if (!expectedKobo) {
      return NextResponse.json({ success: false, error: "Invalid plan duration." }, { status: 400 });
    }

    if (paystackData.data?.amount < expectedKobo) {
      return NextResponse.json({ success: false, error: "Payment amount mismatch." }, { status: 402 });
    }

    const supabase = createAdminClient();
    const table = product_type === "product" ? "store_products" : "listings";

    // Handle expiry extension
    const { data: existing } = await supabase
      .from(table)
      .select("featured_until, is_featured")
      .eq("id", product_id)
      .single();

    const baseDate =
      existing?.is_featured &&
      existing?.featured_until &&
      new Date(existing.featured_until) > new Date()
        ? new Date(existing.featured_until)
        : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + Number(days));

    const { error: updateError } = await supabase
      .from(table)
      .update({
        is_featured: true,
        featured_until: newExpiry.toISOString(),
      })
      .eq("id", product_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Payment received but activation failed. Contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Feature verify error:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}