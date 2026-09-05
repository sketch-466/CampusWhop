import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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

  const adminClient = createAdminClient();
  const { data: bookings } = await adminClient
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
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Bookings</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Platform-wide booking activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: "Total", value: total, color: "text-white" },
          { label: "Pending", value: pending, color: "text-yellow-400" },
          { label: "Confirmed", value: confirmed, color: "text-blue-400" },
          { label: "Completed", value: completed, color: "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
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
              <div key={booking.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">
                        {service?.title ?? "Booking"}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status] ?? STATUS_STYLES.cancelled}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      ₦{booking.amount?.toLocaleString()}
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-zinc-400">
                        Buyer: {buyer?.full_name ?? "Unknown"} · {buyer?.email}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Creator: {creator?.full_name ?? "Unknown"} · {creator?.email}
                      </p>
                      {time && (
                        <p className="text-xs text-zinc-500">
                          {new Date(time).toLocaleString("en-NG", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      )}
                      {service?.duration_minutes && (
                        <p className="text-xs text-zinc-500">{service.duration_minutes} min</p>
                      )}
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
  );
}