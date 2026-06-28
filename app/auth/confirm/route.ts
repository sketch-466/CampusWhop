import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "email" | "recovery" | "invite" | null;
  const next = searchParams.get("next") ?? "/onboarding";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_verification_link", request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // Success — redirect to onboarding (or whatever 'next' was provided)
  return NextResponse.redirect(new URL(next, request.url));
}
