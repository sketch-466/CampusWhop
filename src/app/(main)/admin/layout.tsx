import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const adminNav = [
  { label: "Listings", href: "/admin/listings" },
  { label: "Gigs", href: "/admin/jobs" },
  { label: "Stores", href: "/admin/stores" },
  { label: "Featured", href: "/admin/featured" },
  { label: "Disputes", href: "/admin/disputes" },
  { label: "Opportunities", href: "/admin/opportunities" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Founders", href: "/admin/founders" },
  { label: "Analytics", href: "/admin/analytics" },
  { href: "/admin/referrals", label: "Referrals" }
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <div className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Admin
            </span>
            <h1 className="text-sm font-bold text-white">CampusWhop Control Panel</h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}