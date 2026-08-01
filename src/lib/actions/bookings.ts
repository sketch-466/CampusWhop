"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().min(15).max(480),
  price: z.number().min(500, "Minimum price is ₦500"),
  booking_type: z.enum(["slot", "request"]),
});

const slotSchema = z.object({
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
});

export async function createBookingService(formData: {
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  booking_type: "slot" | "request";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validated = serviceSchema.safeParse(formData);
  if (!validated.success) return { error: validated.error.errors[0].message };

  const { error } = await supabase.from("booking_services").insert({
    creator_id: user.id,
    title: validated.data.title,
    description: validated.data.description || null,
    duration_minutes: validated.data.duration_minutes,
    price: validated.data.price,
    booking_type: validated.data.booking_type,
    is_active: true,
  });

  if (error) return { error: "Failed to create service" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function createBookingSlot(formData: {
  service_id: string;
  starts_at: string;
  ends_at: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validated = slotSchema.safeParse(formData);
  if (!validated.success) return { error: validated.error.errors[0].message };

  const { data: service } = await supabase
    .from("booking_services")
    .select("creator_id")
    .eq("id", validated.data.service_id)
    .eq("creator_id", user.id)
    .single();

  if (!service) return { error: "Service not found" };

  const { error } = await supabase.from("booking_slots").insert({
    service_id: validated.data.service_id,
    creator_id: user.id,
    starts_at: validated.data.starts_at,
    ends_at: validated.data.ends_at,
    is_booked: false,
  });

  if (error) return { error: "Failed to create slot" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function initiateBooking(data: {
  service_id: string;
  slot_id?: string;
  proposed_time?: string;
  buyer_note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const { data: service } = await supabase
    .from("booking_services")
    .select("id, creator_id, price, title, booking_type")
    .eq("id", data.service_id)
    .eq("is_active", true)
    .single();

  if (!service) return { error: "Service not found or inactive" };
  if (service.creator_id === user.id)
    return { error: "You cannot book your own service" };

  if (service.booking_type === "slot" && !data.slot_id)
    return { error: "Please select a time slot" };

  if (service.booking_type === "request" && !data.proposed_time)
    return { error: "Please propose a time" };

  const reference = `cw_book_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile?.email ?? user.email,
        amount: service.price * 100,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/bookings?reference=${reference}`,
        metadata: {
          service_id: service.id,
          slot_id: data.slot_id ?? null,
          proposed_time: data.proposed_time ?? null,
          buyer_note: data.buyer_note ?? null,
          buyer_id: user.id,
          creator_id: service.creator_id,
          amount: service.price,
        },
      }),
    }
  );

  const paystackData = await paystackRes.json();
  if (!paystackData.status) return { error: "Failed to initialize payment" };

  return { url: paystackData.data.authorization_url, reference };
}

export async function verifyBookingPayment(reference: string) {
  const supabase = await createClient();

  const existing = await supabase
    .from("bookings")
    .select("id")
    .eq("paystack_reference", reference)
    .single();

  if (existing.data) return { success: true };

  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const paystackData = await paystackRes.json();
  if (!paystackData.status || paystackData.data.status !== "success")
    return { error: "Payment not verified" };

  const meta = paystackData.data.metadata;

  const { error } = await supabase.from("bookings").insert({
    service_id: meta.service_id,
    slot_id: meta.slot_id ?? null,
    buyer_id: meta.buyer_id,
    creator_id: meta.creator_id,
    status: "pending",
    proposed_time: meta.proposed_time ?? null,
    buyer_note: meta.buyer_note ?? null,
    amount: meta.amount,
    paystack_reference: reference,
  });

  if (error) return { error: "Failed to record booking" };

  if (meta.slot_id) {
    await supabase
      .from("booking_slots")
      .update({ is_booked: true })
      .eq("id", meta.slot_id);
  }

  revalidatePath("/bookings");
  return { success: true };
}

export async function confirmBooking(bookingId: string, meetingLink?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      meeting_link: meetingLink || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("creator_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to confirm booking" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function declineBooking(
  bookingId: string,
  creatorNote?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "declined",
      creator_note: creatorNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("creator_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to decline booking" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function completeBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("creator_id", user.id)
    .eq("status", "confirmed");

  if (error) return { error: "Failed to complete booking" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("buyer_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to cancel booking" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function deactivateService(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("booking_services")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("creator_id", user.id);

  if (error) return { error: "Failed to deactivate service" };

  revalidatePath("/bookings");
  return { success: true };
}

export async function getMyBookings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { buying: [], selling: [] };

  const [{ data: buying }, { data: selling }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `*, booking_services(id, title, duration_minutes, booking_type),
         booking_slots(id, starts_at, ends_at),
         creator:profiles!bookings_creator_id_fkey(id, full_name, avatar_url)`
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        `*, booking_services(id, title, duration_minutes, booking_type),
         booking_slots(id, starts_at, ends_at),
         buyer:profiles!bookings_buyer_id_fkey(id, full_name, avatar_url)`
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return { buying: buying ?? [], selling: selling ?? [] };
}

export async function getMyServices() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("booking_services")
    .select("*, booking_slots(id, starts_at, ends_at, is_booked)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}