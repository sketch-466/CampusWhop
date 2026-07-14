import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Store ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("stores")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to approve store" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
