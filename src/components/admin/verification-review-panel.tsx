"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  GraduationCap,
  Building,
  Hash,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface VerificationReviewPanelProps {
  pending: any[];
  history: any[];
  adminId: string;
}

export function VerificationReviewPanel({
  pending,
  history,
  adminId,
}: VerificationReviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredPending = pending.filter(
    (req) =>
      req.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user.matric_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDecision = async (requestId: string, decision: "approved" | "rejected") => {
    setLoading(requestId);
    const supabase = createClient();

    await supabase
      .from("verification_requests")
      .update({
        status: decision,
        reviewed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    await supabase
      .from("profiles")
      .update({
        is_verified: decision === "approved",
        verification_status: decision,
      })
      .eq("id", pending.find((p) => p.id === requestId)?.user_id);

    setLoading(null);
    setSelectedRequest(null);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, university, or matric number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === "pending"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {/* Pending List */}
      {activeTab === "pending" && (
        <div className="grid gap-3">
          {filteredPending.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400/30 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  All Caught Up!
                </h3>
                <p className="text-sm text-muted-foreground">
                  No pending verification requests. Check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPending.map((req) => (
              <VerificationRequestCard
                key={req.id}
                request={req}
                onReview={() => setSelectedRequest(req)}
              />
            ))
          )}
        </div>
      )}

      {/* History List */}
      {activeTab === "history" && (
        <div className="grid gap-3">
          {history.map((req) => (
            <HistoryCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onApprove={() => handleDecision(selectedRequest.id, "approved")}
          onReject={() => handleDecision(selectedRequest.id, "rejected")}
          loading={loading === selectedRequest.id}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

function VerificationRequestCard({
  request,
  onReview,
}: {
  request: any;
  onReview: () => void;
}) {
  const hoursPending = Math.floor(
    (new Date().getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60)
  );

  return (
    <Card className="border-border bg-card hover:border-emerald-500/30 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg text-emerald-400">
              {request.user.full_name?.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">
                {request.user.full_name}
              </h4>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {hoursPending}h ago
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {request.user.university || "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {request.user.department || "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {request.user.matric_number || "N/A"}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
            onClick={onReview}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryCard({ request }: { request: any }) {
  const isApproved = request.status === "approved";

  return (
    <Card className="border-border bg-card opacity-75">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                {request.user.full_name}
              </h4>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full border",
                  isApproved
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}
              >
                {isApproved ? "APPROVED" : "REJECTED"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reviewed by {request.reviewed_by_user?.full_name || "Admin"} ·{" "}
              {new Date(request.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewModal({
  request,
  onApprove,
  onReject,
  loading,
  onClose,
}: {
  request: any;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Review Verification</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Verify student identity for {request.user.full_name}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Full Name" value={request.user.full_name} icon={User} />
            <InfoField label="University" value={request.user.university} icon={Building} />
            <InfoField label="Department" value={request.user.department} icon={GraduationCap} />
            <InfoField label="Matric Number" value={request.user.matric_number} icon={Hash} />
            <InfoField label="Email" value={request.user.email} icon={User} />
            <InfoField
              label="Submitted"
              value={new Date(request.created_at).toLocaleDateString()}
              icon={Clock}
            />
          </div>

          {/* ID Card Preview */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Student ID Card</h4>
            {request.student_id_image_url ? (
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={request.student_id_image_url}
                  alt="Student ID"
                  className="w-full max-h-80 object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg bg-muted border border-border text-muted-foreground text-sm">
                No ID image uploaded
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
              onClick={onReject}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              onClick={onApprove}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{value || "N/A"}</p>
    </div>
  );
}
