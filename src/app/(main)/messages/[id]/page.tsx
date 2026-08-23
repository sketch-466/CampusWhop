import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/actions/messages";
import ChatView from "@/components/shared/chat-view";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { messages, conversation, currentUserId, error } = await getMessages(id);

  if (error === "Not authorized" || error === "Conversation not found") {
    redirect("/messages");
  }

  return (
    <ChatView
      conversationId={id}
      initialMessages={(messages ?? []) as any}
      conversation={conversation as any}
      currentUserId={currentUserId ?? ""}
    />
  );
}