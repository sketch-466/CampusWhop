import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedCard } from "@/components/feed/feed-card";
import { CreatePost } from "@/components/feed/create-post";
import { TrendingSidebar } from "@/components/feed/trending-sidebar";

export default async function FeedPage() {
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

  // Fetch feed posts (mock data structure for now)
  const { data: posts } = await supabase
    .from("feed_posts")
    .select(`
      *,
      author:profiles(id, full_name, avatar_url, is_verified, university)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Feed */}
      <div className="lg:col-span-8 space-y-4">
        <CreatePost user={user} profile={profile} />
        
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post: any) => <FeedCard key={post.id} post={post} />)
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to CampusWhop
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your campus feed is empty. Start by selling something, joining a course, or creating a post!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block lg:col-span-4">
        <div className="sticky top-20">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}
