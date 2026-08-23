"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const ONESIGNAL_APP_ID = "b7dc34b3-8b3c-49b6-9905-d334a7837c1f";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

async function sendPushNotification(
  recipientUserId: string,
  senderName: string,
  message: string,
  conversationId: string
) {
  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "user_id", relation: "=", value: recipientUserId },
        ],
        headings: { en: `New message from ${senderName}` },
        contents: { en: message.length > 100 ? message.slice(0, 97) + "..." : message },
        url: `https://campuswhop.com/messages/${conversationId}`,
        data: { conversation_id: conversationId },
      }),
    });
  } catch (err) {
    console.error("OneSignal push failed:", err);
  }
}

export async function getOrCreateConversation(
  otherUserId: string,
  listingId?: string,
  orderId?: string
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === otherUserId) return { error: "Cannot message yourself" };

  // Transaction gate — check if they share an order
  const { data: sharedOrder } = await adminClient
    .from("orders")
    .select("id")
    .or(
      `and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`
    )
    .not("status", "eq", "cancelled")
    .limit(1)
    .single();

  if (!sharedOrder) {
    return {
      error: "You can only message users you have an active order with",
    };
  }

  // Check if conversation already exists between these two users
  const { data: existing } = await adminClient
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
    )
    .limit(1)
    .single();

  if (existing) {
    return { conversationId: existing.id };
  }

  // Create new conversation
  const { data: conversation, error } = await adminClient
    .from("conversations")
    .insert({
      participant_one: user.id,
      participant_two: otherUserId,
      listing_id: listingId ?? null,
      order_id: orderId ?? sharedOrder.id,
    })
    .select("id")
    .single();

  if (error || !conversation) {
    return { error: "Failed to create conversation" };
  }

  return { conversationId: conversation.id };
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length > 1000) return { error: "Message too long (max 1000 characters)" };

  // Verify user is a participant
  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationId)
    .single();

  if (!conversation) return { error: "Conversation not found" };

  const isParticipant =
    conversation.participant_one === user.id ||
    conversation.participant_two === user.id;

  if (!isParticipant) return { error: "Not authorized" };

  // Insert message
  const { data: message, error: msgError } = await adminClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select()
    .single();

  if (msgError || !message) return { error: "Failed to send message" };

  // Update conversation last message
  await adminClient
    .from("conversations")
    .update({
      last_message: trimmed,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // Get sender name for notification
  const { data: senderProfile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const senderName = senderProfile?.full_name ?? "Someone";

  // Send push to recipient
  const recipientId =
    conversation.participant_one === user.id
      ? conversation.participant_two
      : conversation.participant_one;

  await sendPushNotification(recipientId, senderName, trimmed, conversationId);

  revalidatePath("/messages");
  return { success: true, message };
}

export async function getConversations() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", conversations: [] };

  const { data, error } = await adminClient
    .from("conversations")
    .select(`
      id,
      last_message,
      last_message_at,
      listing_id,
      order_id,
      participant_one,
      participant_two,
      participant_one_profile:profiles!conversations_participant_one_fkey(
        id, full_name, avatar_url
      ),
      participant_two_profile:profiles!conversations_participant_two_fkey(
        id, full_name, avatar_url
      ),
      listings!conversations_listing_id_fkey(id, title, images)
    `)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return { error: error.message, conversations: [] };

  return { conversations: data ?? [], currentUserId: user.id };
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", messages: [] };

  // Verify participant
  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id, participant_one, participant_two, listing_id, order_id, listings!conversations_listing_id_fkey(id, title, images)")
    .eq("id", conversationId)
    .single();

  if (!conversation) return { error: "Conversation not found", messages: [] };

  const isParticipant =
    conversation.participant_one === user.id ||
    conversation.participant_two === user.id;

  if (!isParticipant) return { error: "Not authorized", messages: [] };

  // Mark unread messages as read
  await adminClient
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const { data: messages, error } = await adminClient
    .from("messages")
    .select(`
      id,
      content,
      sender_id,
      read_at,
      created_at,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message, messages: [] };

  return {
    messages: messages ?? [],
    conversation,
    currentUserId: user.id,
  };
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  // Get conversations where user is a participant
  const { data: convos } = await adminClient
    .from("conversations")
    .select("id")
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

  if (!convos || convos.length === 0) return { count: 0 };

  const convoIds = convos.map((c) => c.id);

  const { count } = await adminClient
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", convoIds)
    .neq("sender_id", user.id)
    .is("read_at", null);

  return { count: count ?? 0 };
}