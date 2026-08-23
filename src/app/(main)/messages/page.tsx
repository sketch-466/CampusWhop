import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/actions/messages";
import ConversationList from "@/components/shared/conversation-list";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { conversations, currentUserId } = await getConversations();

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <h1 className="text-lg font-bold text-zinc-100">Messages</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Your conversations with buyers and sellers
        </p>
      </div>

      <ConversationList
        conversations={conversations ?? []}
        currentUserId={currentUserId ?? ""}
      />
    </div>
  );
}