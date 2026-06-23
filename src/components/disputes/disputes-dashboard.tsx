"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Gavel,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DisputesDashboardProps {
  myDisputes: any[];
  assignedDisputes: any[];
  isMediator: boolean;
  userId: string;
}

export function DisputesDashboard({
  myDisputes,
  assignedDisputes,
  isMediator,
  userId,
}: DisputesDashboardProps) {
  const [activeTab, setActiveTab] = useState<"my" | "mediator">("my");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
            activeTab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          My Disputes {myDisputes.length > 0 && `(${myDisputes.length})`}
        </button>
        {isMediator && (
          <button
            onClick={() => setActiveTab("mediator")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === "mediator"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mediate {assignedDisputes.length > 0 && `(${assignedDisputes.length})`}
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "my" && (
        <div className="space-y-3">
          {myDisputes.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="pt-8 pb-8 text-center">
                <Shield className="h-12 w-12 text-emerald-400/30 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Active Disputes
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Great! All your transactions are going smoothly. If something goes wrong,
                  you have 48 hours after delivery to raise a dispute.
                </p>
              </CardContent>
            </Card>
          ) : (
            myDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                userId={userId}
                onSelect={() => setSelectedDispute(dispute)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "mediator" && (
        <div className="space-y-3">
          {assignedDisputes.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="pt-8 pb-8 text-center">
                <Gavel className="h-12 w-12 text-emerald-400/30 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Cases to Mediate
                </h3>
                <p className="text-sm text-muted-foreground">
                  New disputes will be assigned to you based on availability and your
                  mediation track record.
                </p>
              </CardContent>
            </Card>
          ) : (
            assignedDisputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                userId={userId}
                isMediatorView
                onSelect={() => setSelectedDispute(dispute)}
              />
            ))
          )}
        </div>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          userId={userId}
          isMediator={isMediator && activeTab === "mediator"}
          onClose={() => setSelectedDispute(null)}
        />
      )}
    </div>
  );
}

function DisputeCard({
  dispute,
  userId,
  isMediatorView,
  onSelect,
}: {
  dispute: any;
  userId: string;
  isMediatorView?: boolean;
  onSelect: () => void;
}) {
  const isBuyer = dispute.buyer_id === userId;
  const otherParty = isBuyer ? dispute.order.seller : dispute.order.buyer;
  const timeSinceDispute = Math.floor(
    (new Date().getTime() - new Date(dispute.held_at).getTime()) / (1000 * 60 * 60)
  );

  return (
    <Card
      className="border-border bg-card hover:border-amber-500/30 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
            {dispute.order.product.image_url ? (
              <img
                src={dispute.order.product.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">
                📦
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {dispute.order.product.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isBuyer ? "You bought from" : "You sold to"}{" "}
                  <span className="text-foreground">{otherParty.full_name}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">DISPUTED</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeSinceDispute}h ago
              </span>
              <span className="text-xs text-muted-foreground">
                ₦{dispute.amount.toLocaleString()} in escrow
              </span>
              {isMediatorView && (
                <span className="text-xs text-emerald-400 font-medium">
                  Awaiting your ruling
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
        </div>
      </CardContent>
    </Card>
  );
}

function DisputeDetailModal({
  dispute,
  userId,
  isMediator,
  onClose,
}: {
  dispute: any;
  userId: string;
  isMediator: boolean;
  onClose: () => void;
}) {
  const [ruling, setRuling] = useState<"buyer" | "seller" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const isBuyer = dispute.buyer_id === userId;
  const otherParty = isBuyer ? dispute.order.seller : dispute.order.buyer;

  const handleRuling = async (winner: "buyer" | "seller") => {
    setLoading(true);
    
    // Update escrow status
    await supabase
      .from("escrow_transactions")
      .update({
        status: winner === "buyer" ? "refunded" : "released",
        mediator_id: userId,
      })
      .eq("id", dispute.id);

    // Award mediator reputation
    await supabase.from("reputation_events").insert({
      user_id: userId,
      event_type: "mediation_ruling",
      points: 50,
      metadata: { dispute_id: dispute.id, ruling: winner },
    });

    setLoading(false);
    onClose();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Dispute Details</h3>
              <p className="text-xs text-muted-foreground">
                Case #{dispute.id.slice(0, 8)} · ₦{dispute.amount.toLocaleString()} at stake
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Product</span>
              <span className="text-foreground font-medium">{dispute.order.product.title}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Buyer</span>
              <span className="text-foreground">{dispute.order.buyer.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seller</span>
              <span className="text-foreground">{dispute.order.seller.full_name}</span>
            </div>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="p-6 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2">Dispute Reason</h4>
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            {dispute.dispute_reason || "No reason provided"}
          </p>
        </div>

        {/* Mediator Actions */}
        {isMediator ? (
          <div className="p-6 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gavel className="h-4 w-4 text-emerald-400" />
              Your Ruling
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRuling("buyer")}
                className={cn(
                  "p-4 rounded-lg border text-center transition-all",
                  ruling === "buyer"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-emerald-500/20"
                )}
              >
                <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Refund Buyer</p>
                <p className="text-[10px] mt-1">Return funds to buyer</p>
              </button>
              <button
                onClick={() => setRuling("seller")}
                className={cn(
                  "p-4 rounded-lg border text-center transition-all",
                  ruling === "seller"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-emerald-500/20"
                )}
              >
                <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Release to Seller</p>
                <p className="text-[10px] mt-1">Pay seller from escrow</p>
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Ruling Explanation</Label>
              <Textarea
                placeholder="Explain your decision..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px] bg-muted/50 border-border resize-none text-sm"
              />
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={!ruling || !reason || loading}
              onClick={() => ruling && handleRuling(ruling)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Ruling...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Submit Final Ruling
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Fair rulings earn you 50 WhopCoins and improve your mediator reputation
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <Clock className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Under Review</p>
                <p className="text-xs text-muted-foreground">
                  A campus mediator will review this case within 24 hours
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Add Evidence</h4>
              <Textarea
                placeholder="Add any additional details or upload photos..."
                className="min-h-[80px] bg-muted/50 border-border resize-none text-sm"
              />
              <Button variant="outline" className="w-full border-border">
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Additional Evidence
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium text-foreground block", className)}>{children}</label>;
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
