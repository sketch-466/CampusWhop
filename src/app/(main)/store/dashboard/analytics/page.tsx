import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerStats } from "@/lib/actions/analytics";
import SellerAnalyticsClient from "@/components/shared/seller-analytics-client";

export default async function SellerAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_name")
    .eq("owner_id", user.id)
    .eq("status", "active")
    .is("is_deleted", false)
    .single();

  if (!store) redirect("/store/setup");

  const stats = await getSellerStats(store.id);

  return <SellerAnalyticsClient stats={stats} storeName={store.store_name} />;
}