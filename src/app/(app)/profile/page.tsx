import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { User, Settings } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user's listings
  const { data: listings } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch user's reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
    `)
    .eq("reviewee_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch transaction stats
  const { data: orders } = await supabase
    .from("orders")
    .select("status")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  const stats = {
    listings: listings?.length || 0,
    sales: orders?.filter((o) => o.status === "completed" && profile?.id === user.id).length || 0,
    purchases: orders?.filter((o) => o.status === "completed").length || 0,
    reviews: reviews?.length || 0,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileCard profile={profile} user={user} stats={stats} />
      <ProfileTabs
        listings={listings || []}
        reviews={reviews || []}
        userId={user.id}
      />
    </div>
  );
}
