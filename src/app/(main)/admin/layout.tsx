import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, Briefcase, Home, Shield } from "lucide-react";

export default async function AdminLayout({
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
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Manage listings, jobs, housing, and disputes
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <AdminTab href="/admin/listings" icon={<ShoppingBag className="h-4 w-4" />} label="Listings" />
        <AdminTab href="/admin/jobs" icon={<Briefcase className="h-4 w-4" />} label="Jobs" />
        <AdminTab href="/admin/housing" icon={<Home className="h-4 w-4" />} label="Housing" />
        <AdminTab href="/admin/disputes" icon={<Shield className="h-4 w-4" />} label="Disputes" />
      </div>

      {children}
    </div>
  );
}

function AdminTab({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
