import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { getMyBookings } from "@/lib/actions/bookings";
import { BookingActions } from "@/components/shared/booking-actions";
import { verifyBookingPayment } from "@/lib/actions/bookings";

type PageProps = {
  searchParams: Promise<{ tab?: string; reference?: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function BookingsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab === "selling" ? "selling" : "buying";

  if (params.reference) {
    await verifyBookingPayment(params.reference);
  }

  const { buying, selling } = await getMyBookings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your sessions and appointments
          </p>
        </div>
        <Link href="/bookings/services/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            New Service
          </Button>
        </Link>
      </div>

      {params.reference && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">
            ✓ Booking confirmed — awaiting creator approval.
          </p>
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-800 p-1">
        <Link
          href="/bookings?tab=buying"
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
            tab === "buying"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          My Bookings ({buying.length})
        </Link>
        <Link
          href="/bookings?tab=selling"
          className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
            tab === "selling"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          My Sessions ({selling.length})
        </Link>
      </div>

      {tab === "buying" ? (
        buying.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
            <Calendar className="h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No bookings yet.</p>
            <Link
              href="/creators"
              className="mt-2 text-xs text-emerald-400 hover:underline"
            >
              Browse creators
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {buying.map((booking: any) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="buying"
              />
            ))}
          </div>
        )
      ) : selling.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Calendar className="h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">No sessions yet.</p>
          <Link
            href="/bookings/services/new"
            className="mt-2 text-xs text-emerald-400 hover:underline"
          >
            Create a booking service
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {selling.map((booking: any) => (
            <BookingCard key={booking.id} booking={booking} role="selling" />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  role,
}: {
  booking: any;
  role: "buying" | "selling";
}) {
  const service = booking.booking_services;
  const slot = booking.booking_slots;
  const other =
    role === "buying" ? booking.creator : booking.buyer;

  const otherInitials = other?.full_name
    ? other.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const timeDisplay = slot
    ? new Date(slot.starts_at).toLocaleString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : booking.proposed_time
    ? new Date(booking.proposed_time).toLocaleString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {other?.avatar_url && (
                <AvatarImage src={other.avatar_url} alt={other.full_name} />
              )}
              <AvatarFallback>{otherInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">
                {service?.title ?? "Booking"}
              </p>
              <p className="text-xs text-zinc-400">
                {role === "buying" ? "with" : "from"} {other?.full_name}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
              STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending
            }`}
          >
            {STATUS_LABELS[booking.status] ?? booking.status}
          </span>
        </div>

        {timeDisplay && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            {timeDisplay}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-emerald-400">
            ₦{booking.amount?.toLocaleString()}
          </p>
          {service?.duration_minutes && (
            <span className="text-xs text-zinc-500">
              {service.duration_minutes} min ·{" "}
              {service.booking_type === "slot" ? "Fixed slot" : "Request-based"}
            </span>
          )}
        </div>

        {booking.buyer_note && (
          <p className="text-xs text-zinc-500 italic">
            &ldquo;{booking.buyer_note}&rdquo;
          </p>
        )}

        {booking.meeting_link && booking.status === "confirmed" && (
          <a
            href={booking.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            🔗 Join Meeting
          </a>
        )}

        {booking.creator_note && booking.status === "declined" && (
          <p className="text-xs text-red-400">
            Declined: {booking.creator_note}
          </p>
        )}
      </div>

      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        role={role}
      />
    </div>
  );
}