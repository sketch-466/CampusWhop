import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400",
  confirmed: "bg-blue-900/30 text-blue-400",
  declined: "bg-red-900/30 text-red-400",
  completed: "bg-emerald-900/30 text-emerald-400",
  cancelled: "bg-zinc-800 text-zinc-400",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      booking_services(title, booking_type, duration_minutes),
      booking_slots(starts_at),
      buyer:profiles!bookings_buyer_id_fkey(full_name, email),
      creator:profiles!bookings_creator_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const total = bookings?.length ?? 0;
  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;
  const confirmed = bookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const completed = bookings?.filter((b) => b.status === "completed").length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Platform bookings overview</p>

      {/* Admin Navigation */}
      <div className="flex flex-wrap gap-3 mt-6 border-b border-zinc-800 pb-4">
        <Link href="/admin/listings"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Listings
        </Link>
        <Link href="/admin/jobs"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Gigs
        </Link>
        <Link href="/admin/stores"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Stores
        </Link>
        <Link href="/admin/disputes"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Disputes
        </Link>
        <Link href="/admin/bookings"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
          Bookings
        </Link>
        <Link href="/admin/subscriptions"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Subscriptions
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{total}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-yellow-400">{pending}</p>
          <p className="text-xs text-zinc-500">Pending</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-blue-400">{confirmed}</p>
          <p className="text-xs text-zinc-500">Confirmed</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">{completed}</p>
          <p className="text-xs text-zinc-500">Completed</p>
        </div>
      </div>

      <div className="mt-6">
        {!bookings || bookings.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-400">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking: any) => {
              const service = Array.isArray(booking.booking_services)
                ? booking.booking_services[0] : booking.booking_services
              const slot = Array.isArray(booking.booking_slots)
                ? booking.booking_slots[0] : booking.booking_slots
              const buyer = Array.isArray(booking.buyer)
                ? booking.buyer[0] : booking.buyer
              const creator = Array.isArray(booking.creator)
                ? booking.creator[0] : booking.creator
              const time = slot?.starts_at || booking.proposed_time

              return (
                <div key={booking.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">
                          {service?.title ?? "Booking"}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status] ?? STATUS_STYLES.cancelled}`}>
                          {booking.status}
                        </span>
                        {service?.booking_type && (
                          <span className="text-xs text-zinc-500">
                            {service.booking_type === "slot" ? "Fixed slot" : "Request-based"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-emerald-400 mt-1">
                        ₦{booking.amount?.toLocaleString()}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-zinc-400">
                          Buyer: {buyer?.full_name ?? "Unknown"} · {buyer?.email}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Creator: {creator?.full_name ?? "Unknown"} · {creator?.email}
                        </p>
                        {time && (
                          <p className="text-xs text-zinc-500">
                            Time: {new Date(time).toLocaleString("en-NG", {
                              weekday: "short", day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                        {service?.duration_minutes && (
                          <p className="text-xs text-zinc-500">
                            Duration: {service.duration_minutes} min
                          </p>
                        )}
                        <p className="text-xs text-zinc-600">
                          Created: {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {booking.buyer_note && (
                        <p className="mt-2 text-xs text-zinc-500 italic">
                          &ldquo;{booking.buyer_note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}