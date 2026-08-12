import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const adminClient = createAdminClient();

        // Ensure Google users have email_verified = true
        // and full_name populated from Google metadata
        const googleName = user.user_metadata?.full_name ||
          user.user_metadata?.name || null;

        await adminClient
          .from("profiles")
          .update({
            email_verified: true,
            full_name: googleName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .is("full_name", null); // only set name if not already set

        // Also ensure email_verified for users who already have a name
        await adminClient
          .from("profiles")
          .update({
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .not("full_name", "is", null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}