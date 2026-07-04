"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "pending" | "active" | "rejected";
  images: string[];
  created_at: string;
  seller_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPendingListings();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchPendingListings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        profiles:seller_id (
          full_name,
          email
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setToast({ message: "Failed to load listings", type: "error" });
      console.error(error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  }

  async function approveListing(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", id);

    if (error) {
      setToast({ message: "Failed to approve listing", type: "error" });
      console.error(error);
    } else {
      setToast({ message: "Listing approved!", type: "success" });
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setActionLoading(null);
  }

  async function rejectListing(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("listings")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      setToast({ message: "Failed to reject listing", type: "error" });
      console.error(error);
    } else {
      setToast({ message: "Listing rejected", type: "success" });
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-zinc-400 mt-1">Review and approve pending listings</p>
        </div>
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
          {listings.length} Pending
        </Badge>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-zinc-400 text-lg">No pending listings to review</p>
          <p className="text-zinc-500 text-sm mt-2">All caught up! Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex gap-5"
            >
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                {listing.images && listing.images.length > 0 ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white truncate">
                      {listing.title}
                    </h3>
                    <p className="text-emerald-400 font-medium mt-1">
                      ₦{listing.price.toLocaleString()}
                    </p>
                    <p className="text-zinc-500 text-sm mt-1">
                      by {listing.profiles?.full_name || "Unknown"} · {" "}
                      {listing.profiles?.email || "No email"}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
                    Pending
                  </Badge>
                </div>

                <p className="text-zinc-400 text-sm mt-3 line-clamp-2">
                  {listing.description}
                </p>

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => approveListing(listing.id)}
                    disabled={actionLoading === listing.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    {actionLoading === listing.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    onClick={() => rejectListing(listing.id)}
                    disabled={actionLoading === listing.id}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
