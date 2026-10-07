import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin =
    ["admin", "super_admin"].includes(me?.role ?? "") || me?.is_admin === true;
  if (!isAdmin) redirect("/dashboard");

  const { q } = await searchParams;
  // Strip characters that could break the PostgREST filter string
  const term = (q ?? "").replace(/[^a-zA-Z0-9@._\-\/ ]/g, "").trim().slice(0, 60);

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id, full_name, email, university, matric_number, role, is_admin, verification_status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (term) {
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,matric_number.ilike.%${term}%`
    );
  }

  const { data: users, error } = await query;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Showing up to 100 most recent users.
      </p>

      <form className="mt-4 flex gap-2" action="/admin/users" method="get">
        <input
          name="q"
          defaultValue={term}
          placeholder="Search name, email or matric"
          className="h-10 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-400">Failed to load users.</p>
      )}

      <div className="mt-6 space-y-3">
        {(users ?? []).map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">
                {u.full_name || "Unnamed"}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                  {u.role ?? "user"}
                  {u.is_admin ? " · legacy admin" : ""}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    u.verification_status === "verified"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : u.verification_status === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : u.verification_status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {u.verification_status ?? "unverified"}
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{u.email}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {u.university ?? "No university"} · {u.matric_number ?? "No matric"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Joined {new Date(u.created_at).toLocaleDateString("en-NG")}
            </p>
          </div>
        ))}
        {!error && (users ?? []).length === 0 && (
          <p className="text-sm text-zinc-500">No users found.</p>
        )}
      </div>
    </div>
  );
}