import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DropsGrid } from "@/components/drops/drops-grid";
import { CreateDropButton } from "@/components/drops/create-drop-button";
import { Flame, Clock } from "lucide-react";

export default async function DropsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch active and upcoming drops
  const { data: activeDrops } = await supabase
    .from("campus_drops")
    .select(`
      *,
      product:products(id, title, price, image_url, condition),
      seller:profiles(id, full_name, avatar_url, is_verified)
    `)
    .eq("status", "active")
    .gte("drop_time", new Date().toISOString())
    .order("drop_time", { ascending: true })
    .limit(10);

  const { data: upcomingDrops } = await supabase
    .from("campus_drops")
    .select(`
      *,
      product:products(id, title, price, image_url),
      seller:profiles(id, full_name, avatar_url, is_verified)
    `)
    .eq("status", "scheduled")
    .order("drop_time", { ascending: true })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-rose-400" />
            Campus Drops
          </h1>
          <p className="text-sm text-muted-foreground">
            Limited-time flash sales from verified campus sellers
          </p>
        </div>
        <CreateDropButton />
      </div>

      {/* Active Drops Banner */}
      {activeDrops && activeDrops.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-rose-950/50 to-orange-950/30 border border-rose-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-sm font-semibold text-rose-400">Live Now</span>
            <span className="text-xs text-muted-foreground">
              {activeDrops.length} active drops
            </span>
          </div>
          <DropsGrid drops={activeDrops} isActive />
        </div>
      )}

      {/* Upcoming Drops */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Coming Soon</h2>
        </div>
        <DropsGrid drops={upcomingDrops || []} isActive={false} />
      </div>
    </div>
  );
}
