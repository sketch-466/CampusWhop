import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EventsGrid } from "@/components/events/events-grid";
import { Calendar, Plus, MapPin } from "lucide-react";

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date().toISOString();

  const { data: upcomingEvents } = await supabase
    .from("campus_events")
    .select(`
      *,
      organizer:profiles(id, full_name, avatar_url, is_verified)
    `)
    .gte("event_date", now)
    .order("event_date", { ascending: true })
    .limit(20);

  const { data: pastEvents } = await supabase
    .from("campus_events")
    .select(`
      *,
      organizer:profiles(id, full_name, avatar_url, is_verified)
    `)
    .lt("event_date", now)
    .order("event_date", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-400" />
            Campus Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover and host events on campus
          </p>
        </div>
        <a href="/create-event">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Host Event
          </button>
        </a>
      </div>

      {/* Featured Banner */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-emerald-950/50 to-blue-950/30 border border-emerald-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-lg font-bold text-foreground mb-2">
            🎓 Freshers Week 2026
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-md">
            The biggest campus event of the year. Music, games, networking, and exclusive marketplace deals.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              Oct 15 - 22, 2026
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              Main Campus Grounds
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Upcoming Events
        </h2>
        <EventsGrid events={upcomingEvents || []} isUpcoming />
      </div>

      {pastEvents && pastEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Past Events</h2>
          <EventsGrid events={pastEvents} isUpcoming={false} />
        </div>
      )}
    </div>
  );
}
