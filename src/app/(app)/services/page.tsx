import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ServicesDirectory } from "@/components/services/services-directory";
import { Wrench, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function ServicesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: services } = await supabase
    .from("student_services")
    .select(`
      *,
      provider:profiles(id, full_name, avatar_url, is_verified, reputation_score)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const categories = [
    "All",
    "Tutoring",
    "Design",
    "Coding",
    "Photography",
    "Writing",
    "Event Planning",
    "Fitness",
    "Music",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-emerald-400" />
            Student Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Hire talented students for gigs, tutoring, and creative work
          </p>
        </div>
        <a href="/offer-service">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
            Offer a Service
          </button>
        </a>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted border border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ServicesDirectory services={services || []} />
    </div>
  );
}
