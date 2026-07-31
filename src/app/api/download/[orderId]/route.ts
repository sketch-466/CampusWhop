import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Verify the requesting user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the order using admin client
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, buyer_id, status, digital_file_url")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Only the buyer can download
  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only completed orders unlock the file
  if (order.status !== "completed") {
    return NextResponse.json(
      { error: "Payment not yet completed" },
      { status: 403 }
    );
  }

  if (!order.digital_file_url) {
    return NextResponse.json(
      { error: "No file attached to this order" },
      { status: 404 }
    );
  }

  // Redirect to the B2 URL — file is not public-guessable since
  // the URL is never exposed in the UI, only through this route
  return NextResponse.redirect(order.digital_file_url);
}