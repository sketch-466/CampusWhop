"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface PulseEvent {
  id: string;
  type: "sale" | "listing" | "join" | "booking" | "chapter";
  message: string;
  time: string;
  emoji: string;
}

function formatName(fullName: string | null): string {
  if (!fullName) return "A student";
  const parts = fullName.trim().split(" ");
  const first = parts[0];
  const lastInitial = parts[1]?.[0] ? `${parts[1][0]}.` : "";
  return lastInitial ? `${first} ${lastInitial}` : first;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export async function getPulseEvents(): Promise<PulseEvent[]> {
  const adminClient = createAdminClient();
  const events: PulseEvent[] = [];

  // Recent completed orders
  const { data: orders } = await adminClient
    .from("orders")
    .select(`
      id, amount, completed_at, created_at,
      listings!orders_listing_id_fkey(title, product_type, category),
      seller:profiles!orders_seller_id_fkey(full_name)
    `)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(5);

  for (const order of orders ?? []) {
    const seller = Array.isArray(order.seller)
      ? order.seller[0]
      : order.seller;
    const listing = Array.isArray(order.listings)
      ? order.listings[0]
      : order.listings;
    const name = formatName(seller?.full_name ?? null);
    const category = listing?.category ?? "item";
    const amount = `₦${Number(order.amount).toLocaleString()}`;
    const time = order.completed_at ?? order.created_at;

    const categoryEmojis: Record<string, string> = {
      phones: "📱", laptops: "💻", books: "📚",
      gadgets: "🔌", services: "⚡", notes: "📝",
      templates: "🎨", ebooks: "📖", designs: "✏️", other: "📦",
    };

    events.push({
      id: `order-${order.id}`,
      type: "sale",
      message: `${name} just made a sale for ${amount}`,
      time: timeAgo(time),
      emoji: categoryEmojis[category] ?? "💰",
    });
  }

  // Recent listings
  const { data: listings } = await adminClient
    .from("listings")
    .select(`
      id, title, price, category, created_at,
      seller:profiles!listings_seller_id_fkey(full_name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  for (const listing of listings ?? []) {
    const seller = Array.isArray(listing.seller)
      ? listing.seller[0]
      : listing.seller;
    const name = formatName(seller?.full_name ?? null);
    const price = `₦${Number(listing.price).toLocaleString()}`;

    events.push({
      id: `listing-${listing.id}`,
      type: "listing",
      message: `${name} listed "${listing.title}" for ${price}`,
      time: timeAgo(listing.created_at),
      emoji: "🛍️",
    });
  }

  // Recent signups
  const { data: newUsers } = await adminClient
    .from("profiles")
    .select("id, full_name, university, created_at")
    .not("full_name", "is", null)
    .not("onboarding_completed", "is", null)
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(4);

  for (const u of newUsers ?? []) {
    const name = formatName(u.full_name);
    events.push({
      id: `join-${u.id}`,
      type: "join",
      message: `${name} just joined CampusWhop`,
      time: timeAgo(u.created_at),
      emoji: "🎓",
    });
  }

  // Recent bookings
  const { data: bookings } = await adminClient
    .from("bookings")
    .select(`
      id, created_at,
      booking_services!bookings_service_id_fkey(title),
      buyer:profiles!bookings_buyer_id_fkey(full_name)
    `)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(3);

  for (const booking of bookings ?? []) {
    const buyer = Array.isArray(booking.buyer)
      ? booking.buyer[0]
      : booking.buyer;
    const service = Array.isArray(booking.booking_services)
      ? booking.booking_services[0]
      : booking.booking_services;
    const name = formatName(buyer?.full_name ?? null);

    events.push({
      id: `booking-${booking.id}`,
      type: "booking",
      message: `${name} just booked "${service?.title ?? "a session"}"`,
      time: timeAgo(booking.created_at),
      emoji: "📅",
    });
  }

  // Recent chapter unlocks
  const { data: unlocks } = await adminClient
    .from("chapter_unlocks")
    .select(`
      id, created_at,
      user:profiles!chapter_unlocks_user_id_fkey(full_name),
      novel_chapters!chapter_unlocks_chapter_id_fkey(title, chapter_number)
    `)
    .order("created_at", { ascending: false })
    .limit(3);

  for (const unlock of unlocks ?? []) {
    const reader = Array.isArray(unlock.user)
      ? unlock.user[0]
      : unlock.user;
    const chapter = Array.isArray(unlock.novel_chapters)
      ? unlock.novel_chapters[0]
      : unlock.novel_chapters;
    const name = formatName(reader?.full_name ?? null);

    events.push({
      id: `chapter-${unlock.id}`,
      type: "chapter",
      message: `${name} unlocked Chapter ${chapter?.chapter_number ?? "?"}`,
      time: timeAgo(unlock.created_at),
      emoji: "📖",
    });
  }

  // Sort by recency — most recent first
  // Since timeAgo is display-only, we sort by type priority then trim to 10
  return events.slice(0, 10);
}