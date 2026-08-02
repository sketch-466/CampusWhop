import { schedules } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const bookingReminders = schedules.task({
  id: "booking-reminders",
  cron: "0 8 * * *",
  run: async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY!);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id, amount, proposed_time, meeting_link,
        booking_services(title, duration_minutes),
        booking_slots(starts_at),
        buyer:profiles!bookings_buyer_id_fkey(full_name, email),
        creator:profiles!bookings_creator_id_fkey(full_name, email)
      `)
      .eq("status", "confirmed")
      .or(
        `and(booking_slots.starts_at.gte.${now.toISOString()},booking_slots.starts_at.lte.${in24h.toISOString()}),and(proposed_time.gte.${now.toISOString()},proposed_time.lte.${in24h.toISOString()})`
      );

    if (error) throw new Error(error.message);
    if (!bookings || bookings.length === 0) return { reminded: 0 };

    let reminded = 0;

    for (const booking of bookings) {
      const service = Array.isArray(booking.booking_services)
        ? booking.booking_services[0] : booking.booking_services;
      const slot = Array.isArray(booking.booking_slots)
        ? booking.booking_slots[0] : booking.booking_slots;
      const buyer = Array.isArray(booking.buyer)
        ? booking.buyer[0] : booking.buyer;
      const creator = Array.isArray(booking.creator)
        ? booking.creator[0] : booking.creator;

      const sessionTime = slot?.starts_at || booking.proposed_time;
      const timeStr = sessionTime
        ? new Date(sessionTime).toLocaleString("en-NG", {
            weekday: "short", day: "numeric", month: "short",
            hour: "2-digit", minute: "2-digit",
          })
        : "Scheduled time";

      const meetingSection = booking.meeting_link
        ? `<p>Meeting link: <a href="${booking.meeting_link}">${booking.meeting_link}</a></p>`
        : "";

      if (buyer?.email) {
        await resend.emails.send({
          from: "noreply@campuswhop.com",
          to: buyer.email,
          subject: `Reminder: Your session "${service?.title}" is tomorrow`,
          html: `
            <h2>Session Reminder</h2>
            <p>Hi ${buyer.full_name ?? "there"},</p>
            <p>Your booking <strong>${service?.title ?? "session"}</strong> with <strong>${creator?.full_name ?? "your creator"}</strong> is coming up.</p>
            <p><strong>Time:</strong> ${timeStr}</p>
            <p><strong>Duration:</strong> ${service?.duration_minutes ?? 60} minutes</p>
            ${meetingSection}
            <p>Visit <a href="https://campuswhop.com/bookings">your bookings</a> for details.</p>
          `,
        });
      }

      if (creator?.email) {
        await resend.emails.send({
          from: "noreply@campuswhop.com",
          to: creator.email,
          subject: `Reminder: Session with ${buyer?.full_name ?? "a client"} is tomorrow`,
          html: `
            <h2>Session Reminder</h2>
            <p>Hi ${creator.full_name ?? "there"},</p>
            <p>You have a session <strong>${service?.title ?? "booking"}</strong> with <strong>${buyer?.full_name ?? "your client"}</strong> coming up.</p>
            <p><strong>Time:</strong> ${timeStr}</p>
            <p><strong>Duration:</strong> ${service?.duration_minutes ?? 60} minutes</p>
            ${meetingSection}
            <p>Visit <a href="https://campuswhop.com/bookings">your bookings</a> to mark it complete after the session.</p>
          `,
        });
      }

      reminded++;
    }

    return { reminded };
  },
});