"use client";

import { useState } from "react";
import { Image, Zap, ShoppingBag, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatePostProps {
  user: any;
  profile: any;
}

export function CreatePost({ user, profile }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-emerald-500/10 shrink-0">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-emerald-950 text-emerald-400 text-sm">
            {profile?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="What's happening on campus?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-[40px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm placeholder:text-muted-foreground/50"
          />
          {isExpanded && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Image className="h-4 w-4 mr-1.5" />
                  Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  Sell
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Course
                </Button>
              </div>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={!content.trim()}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
