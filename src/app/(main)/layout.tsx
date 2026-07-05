import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        user={{
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          email: user.email || "",
          is_admin: profile?.is_admin || false,
        }}
      />
      <main>{children}</main>
    </div>
  );
}