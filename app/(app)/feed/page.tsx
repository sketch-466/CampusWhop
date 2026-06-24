import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import Link from "next/link";

export default async function FeedPage() {
  const supabase = createClient();
  
  const { data: posts } = await supabase
    .from("feed_posts")
    .select(`
      *,
      author:profiles(id, full_name, avatar_url, reputation_score)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      job: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      marketplace: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      opportunity: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      scholarship: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      announcement: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
    return colors[type] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 lg:pb-4">
      {/* Create Post */}
      <Card className="glass border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30">
              <AvatarImage src="" />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400">CW</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link href="/create-post">
                <div className="bg-white/5 rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                  Share an opportunity, job, or listing...
                </div>
              </Link>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              Job
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              Sell
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              Opportunity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed Posts */}
      {posts?.map((post) => (
        <Card key={post.id} className="glass border-white/10 hover-lift animate-in">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
                  <AvatarImage src={post.author?.avatar_url} />
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                    {post.author?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{post.author?.full_name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {post.author?.reputation_score || 0} RP
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${getPostTypeColor(post.post_type)}`}>
                {post.post_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{post.content}</p>
            
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="rounded-lg overflow-hidden mb-3 border border-white/10">
                <img 
                  src={post.media_urls[0]} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-white/5 text-muted-foreground px-2 py-1 rounded-full border border-white/10">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes_count}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span>{post.shares_count}</span>
                </button>
              </div>
              <button className="text-muted-foreground hover:text-emerald-400 transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {(!posts || posts.length === 0) && (
        <Card className="glass border-white/10 p-8 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
        </Card>
      )}
    </div>
  );
}
