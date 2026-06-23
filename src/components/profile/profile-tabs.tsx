"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Star, MessageSquare, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  listings: any[];
  reviews: any[];
  userId: string;
}

export function ProfileTabs({ listings, reviews }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setActiveTab("listings")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "listings"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="h-4 w-4" />
          Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "reviews"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className="h-4 w-4" />
          Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === "listings" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-12 glass rounded-xl">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No listings yet</p>
              <Link href="/sell">
                <button className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 font-medium">
                  List your first item →
                </button>
              </Link>
            </div>
          ) : (
            listings.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="border-border bg-card hover:border-emerald-500/30 transition-all group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {item.image_urls?.[0] ? (
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📦
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                        ₦{item.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border",
                            item.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {item.status}
                        </span>
                        {item.course_code && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.course_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 glass rounded-xl">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm text-emerald-400">
                        {review.reviewer.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {review.reviewer.full_name}
                          </span>
                          <VerificationBadge status="verified" size="sm" />
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < review.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {review.comment}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
