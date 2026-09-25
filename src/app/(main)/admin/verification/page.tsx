"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  Loader2,
  AlertCircle,
  BadgeCheck,
} from "lucide-react"
import {
  adminGetAllVerifications,
  adminApproveVerification,
  adminRejectVerification,
  adminGetDocumentUrl,
} from "@/lib/actions/verification"

type Status = "pending" | "verified" | "rejected" | "unverified"

const STATUS_TABS: { label: string; value: Status | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  admission_letter: "Admission Letter",
  student_id: "Student ID",
  fees_receipt: "Fees Receipt",
  course_registration: "Course Registration",
}

export default function AdminVerificationPage() {
  const [activeTab, setActiveTab] = useState<Status | "all">("pending")
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})

  async function loadRecords() {
    setLoading(true)
    const data = await adminGetAllVerifications(
      activeTab === "all" ? undefined : activeTab
    )
    setRecords(data)
    setLoading(false)
  }

  useEffect(() => {
    loadRecords()
  }, [activeTab])

  async function handleViewDoc(path: string, key: string) {
    if (docUrls[key]) {
      window.open(docUrls[key], "_blank")
      return
    }
    const result = await adminGetDocumentUrl(path)
    if ("url" in result) {
      setDocUrls((p) => ({ ...p, [key]: result.url }))
      window.open(result.url, "_blank")
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId)
    await adminApproveVerification(userId)
    await loadRecords()
    setActionLoading(null)
    setExpandedId(null)
  }

  async function handleReject(userId: string) {
    if (!rejectReason.trim()) return
    setActionLoading(userId)
    await adminRejectVerification(userId, rejectReason.trim())
    await loadRecords()
    setActionLoading(null)
    setRejectingId(null)
    setRejectReason("")
    setExpandedId(null)
  }

  const pending = records.filter((r) => r.verification_status === "pending").length

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BadgeCheck className="h-5 w-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Student Verification</h1>
            {pending > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {pending} pending
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            Review and approve student identity documents
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {activeTab === "all" ? "" : activeTab} submissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const isExpanded = expandedId === record.id
              const isRejecting = rejectingId === record.id
              const isActing = actionLoading === record.id
              const docs = record.verification_docs

              return (
                <div
                  key={record.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : record.id)
                    }
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Status dot */}
                    <div className="shrink-0">
                      {record.verification_status === "pending" && (
                        <Clock className="h-4 w-4 text-amber-400" />
                      )}
                      {record.verification_status === "verified" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {record.verification_status === "rejected" && (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {record.full_name || "No name"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {record.matric_number || record.email}
                        {docs?.documentType
                          ? ` · ${DOC_TYPE_LABELS[docs.documentType] || docs.documentType}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-600">
                        {formatDistanceToNow(new Date(record.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-zinc-600 transition-transform shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-4 space-y-4">
                      {/* Student details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-600 block">Email</span>
                          <span className="text-zinc-300">{record.email}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">University</span>
                          <span className="text-zinc-300">{record.university || "—"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">Matric Number</span>
                          <span className="text-zinc-300">{record.matric_number || "—"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">Document Type</span>
                          <span className="text-zinc-300">
                            {DOC_TYPE_LABELS[docs?.documentType] || "—"}
                          </span>
                        </div>
                        {docs?.submittedAt && (
                          <div>
                            <span className="text-zinc-600 block">Submitted</span>
                            <span className="text-zinc-300">
                              {new Date(docs.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {record.verified_at && (
                          <div>
                            <span className="text-zinc-600 block">Verified at</span>
                            <span className="text-emerald-400">
                              {new Date(record.verified_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {record.verification_rejection_reason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
                          <span className="font-medium block mb-0.5">Rejection reason:</span>
                          {record.verification_rejection_reason}
                        </div>
                      )}

                      {/* View documents */}
                      {docs && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleViewDoc(docs.documentUrl, `doc-${record.id}`)
                            }
                            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Document
                          </button>
                          <button
                            onClick={() =>
                              handleViewDoc(docs.selfieUrl, `selfie-${record.id}`)
                            }
                            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Selfie
                          </button>
                        </div>
                      )}

                      {/* Reject reason input */}
                      {isRejecting && (
                        <div>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (student will see this)..."
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-red-500"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                setRejectingId(null)
                                setRejectReason("")
                              }}
                              className="flex-1 border border-zinc-700 text-zinc-400 text-sm py-2 rounded-lg hover:border-zinc-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReject(record.id)}
                              disabled={!rejectReason.trim() || isActing}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                            >
                              {isActing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Confirm Reject"
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons — pending only */}
                      {record.verification_status === "pending" && !isRejecting && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={isActing}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            {isActing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setRejectingId(record.id)}
                            disabled={isActing}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}