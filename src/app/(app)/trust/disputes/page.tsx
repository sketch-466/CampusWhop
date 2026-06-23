import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DisputesDashboard } from "@/components/disputes/disputes-dashboard";
import { Shield, Scale } from "lucide-react";

export default async function DisputesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's disputes (as buyer or seller)
  const { data: myDisputes } = await supabase
    .from("escrow_transactions")
    .select(`
      *,
      order:orders(
        *,
        product:products(title, image_url),
        buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url),
        seller:profiles!orders_seller_id_fkey(full_name, avatar_url)
      )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  // Check if user is a mediator
  const { data: profile } = await supabase
    .from("profiles")
    .select("reputation_score, is_mediator")
    .eq("id", user.id)
    .single();

  // Fetch disputes assigned to this mediator
  let assignedDisputes = null;
  if (profile?.is_mediator) {
    const { data } = await supabase
      .from("escrow_transactions")
      .select(`
        *,
        order:orders(
          *,
          product:products(title, image_url),
          buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url),
          seller:profiles!orders_seller_id_fkey(full_name, avatar_url)
        )
      `)
      .eq("mediator_id", user.id)
      .eq("status", "disputed")
      .order("created_at", { ascending: false });
    assignedDisputes = data;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Scale className="h-6 w-6 text-emerald-400" />
          Dispute Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Resolve transaction issues and view your case history
        </p>
      </div>

      <DisputesDashboard
        myDisputes={myDisputes || []}
        assignedDisputes={assignedDisputes || []}
        isMediator={profile?.is_mediator || false}
        userId={user.id}
      />
    </div>
  );
}
