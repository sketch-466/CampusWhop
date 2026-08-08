import { createClient } from "@/lib/supabase/server";
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

  // Fetch profile only if logged in
  const profile = user
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url, email, is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => data)
    : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {user ? (
        <Navbar
          user={{
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            email: user.email || "",
            is_admin: profile?.is_admin || false,
          }}
        />
      ) : (
        <PublicNavbar />
      )}
      <main>{children}</main>
    </div>
  );
}

function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="text-lg font-bold text-emerald-500">
          CampusWhop
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}