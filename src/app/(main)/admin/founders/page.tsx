import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BadgeCheck } from "lucide-react";

const adminNav = [
  { label: "Listings", href: "/admin/listings" },
  { label: "Gigs", href: "/admin/jobs" },
  { label: "Stores", href: "/admin/stores" },
  { label: "Disputes", href: "/admin/disputes" },
  { label: "Opportunities", href: "/admin/opportunities" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Founders", href: "/admin/founders" },
  { label: "Analytics", href: "/admin/analytics" },
];

export default async function AdminFoundersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; success?: string }>;
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

  const params = await searchParams;
  const search = params.search?.trim() || "";

  const adminClient = createAdminClient();

  // Fetch current founding creators
  const { data: founders } = await adminClient
    .from("profiles")
    .select("id, full_name, email, avatar_url, creator_type, is_founding_creator, fee_exempt_until, university")
    .eq("is_founding_creator", true)
    .order("full_name", { ascending: true });

  // Search results
  let searchResults: any[] = [];
  if (search.length >= 2) {
    const { data } = await adminClient
      .from("profiles")
      .select("id, full_name, email, avatar_url, creator_type, is_founding_creator, fee_exempt_until, university")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .eq("is_founding_creator", false)
      .limit(10);
    searchResults = data ?? [];
  }

  async function grantFounder(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    if (!userId) return;

    const adminClient = createAdminClient();
    const exemptUntil = new Date();
    exemptUntil.setMonth(exemptUntil.getMonth() + 3);

    await adminClient
      .from("profiles")
      .update({
        is_founding_creator: true,
        fee_exempt_until: exemptUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    revalidatePath("/admin/founders");
    redirect("/admin/founders?success=granted");
  }

  async function revokeFounder(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    if (!userId) return;

    const adminClient = createAdminClient();

    await adminClient
      .from("profiles")
      .update({
        is_founding_creator: false,
        fee_exempt_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    revalidatePath("/admin/founders");
    redirect("/admin/founders");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Platform management</p>

      <div className="flex flex-wrap gap-2 mt-6 border-b border-zinc-800 pb-4">
        {adminNav.map((item) => (
          <Link key={item.href} href={item.href}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              item.href === "/admin/founders"
                ? "bg-emerald-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-8">

        {params.success === "granted" && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-sm text-emerald-400">
              ✓ Founding creator status granted. Fee exemption active for 3 months.
            </p>
          </div>
        )}

        {/* Search to add founders */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Grant Founding Creator Status</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Search by name or email. Grants the 🌟 badge and 3-month fee exemption.
            </p>
          </div>

          <form method="GET" className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </form>

          {search.length >= 2 && (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No users found matching &ldquo;{search}&rdquo; — they may already be a founding creator.
                </p>
              ) : (
                searchResults.map((u) => (
                  <div key={u.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-white">
                        {u.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{u.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                        {u.university && (
                          <p className="text-xs text-zinc-500 truncate">{u.university}</p>
                        )}
                        {u.creator_type && (
                          <span className="mt-0.5 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            {u.creator_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <form action={grantFounder} className="shrink-0">
                      <input type="hidden" name="user_id" value={u.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                      >
                        🌟 Grant
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Current founders */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Current Founding Creators
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({founders?.length ?? 0})
              </span>
            </h2>
          </div>

          {!founders || founders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-400">No founding creators yet.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Search for a user above to grant founding creator status.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {founders.map((founder) => {
                const exemptUntil = founder.fee_exempt_until
                  ? new Date(founder.fee_exempt_until)
                  : null;
                const isExemptActive = exemptUntil && exemptUntil > new Date();
                const daysLeft = exemptUntil
                  ? Math.max(0, Math.ceil((exemptUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : 0;

                return (
                  <div key={founder.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-amber-800/30 bg-amber-900/10 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-amber-900/40 flex items-center justify-center text-sm font-semibold text-amber-400">
                        {founder.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-white truncate">
                            {founder.full_name ?? "Unknown"}
                          </p>
                          <span className="text-base">🌟</span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{founder.email}</p>
                        {founder.creator_type && (
                          <span className="mt-0.5 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            {founder.creator_type}
                          </span>
                        )}
                        <p className={`mt-0.5 text-xs ${isExemptActive ? "text-emerald-400" : "text-zinc-500"}`}>
                          {isExemptActive
                            ? `Fee exempt · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                            : "Fee exemption expired"}
                        </p>
                      </div>
                    </div>
                    <form action={revokeFounder} className="shrink-0">
                      <input type="hidden" name="user_id" value={founder.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Revoke
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}