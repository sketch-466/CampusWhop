"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// ─── Types ───────────────────────────────────────────────

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"

export interface VerificationSubmission {
  documentUrl: string
  selfieUrl: string
  documentType: "admission_letter" | "student_id" | "fees_receipt" | "course_registration"
}

export interface VerificationRecord {
  verification_status: VerificationStatus
  verification_docs: {
    documentUrl: string
    selfieUrl: string
    documentType: string
    submittedAt: string
  } | null
  verification_rejection_reason: string | null
  verified_at: string | null
}

// ─── Internal helpers (not exported) ─────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VERIFICATION_BUCKET = "verification-docs"
const MAX_REJECTION_REASON_LENGTH = 1000

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value)
}

type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "unauthenticated" | "unauthorized" }

/**
 * Authenticates the current session and authorizes it as an admin.
 * Accepts role "admin" | "super_admin" OR legacy is_admin === true.
 * createAdminClient() must only be called AFTER this returns ok: true.
 */
async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "unauthenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()

  const isAuthorized =
    profile?.role === "admin" ||
    profile?.role === "super_admin" ||
    profile?.is_admin === true

  if (!isAuthorized) return { ok: false, reason: "unauthorized" }
  return { ok: true, userId: user.id }
}

/**
 * Normalizes a stored verification_docs value to a bare storage path
 * (<userId>/<filename>). Handles bare paths and full Supabase storage URLs.
 */
function toStoragePath(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = decodeURIComponent(new URL(trimmed).pathname)
      const marker = `/${VERIFICATION_BUCKET}/`
      const idx = pathname.indexOf(marker)
      if (idx === -1) return null
      return pathname.slice(idx + marker.length) || null
    } catch {
      return null
    }
  }

  return trimmed
}

/**
 * Validates that a path is exactly "<uuid>/<filename>" with no traversal.
 * Returns the target user id, or null if the path is malformed.
 */
function parseDocumentPath(path: unknown): { userId: string } | null {
  if (typeof path !== "string") return null
  if (!path || path.length > 300) return null
  if (path.startsWith("/") || path.includes("\\") || path.includes("..")) return null
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(path)) return null

  const segments = path.split("/")
  if (segments.length !== 2) return null

  const [userId, fileName] = segments
  if (!isUuid(userId)) return null
  if (!fileName || fileName === "." || fileName === "..") return null

  return { userId }
}

// ─── Student: Get own verification status ────────────────

export async function getVerificationStatus(): Promise<{
  status: VerificationStatus
  docs: VerificationRecord["verification_docs"]
  rejectionReason: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("verification_status, verification_docs, verification_rejection_reason")
    .eq("id", user.id)
    .single()

  if (error || !data) return null

  return {
    status: data.verification_status as VerificationStatus,
    docs: data.verification_docs,
    rejectionReason: data.verification_rejection_reason,
  }
}

// ─── Student: Upload doc to Supabase Storage ─────────────

export async function getVerificationUploadUrl(
  fileName: string,
  fileType: string
): Promise<{ path: string; signedUploadUrl: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const ext = fileName.split(".").pop()
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from("verification-docs")
    .createSignedUploadUrl(path)

  if (error || !data) return { error: "Failed to create upload URL" }

  return { path, signedUploadUrl: data.signedUrl }
}

// ─── Student: Submit verification ────────────────────────

export async function submitVerification(
  submission: VerificationSubmission
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Check current status — don't allow resubmit if pending or verified
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single()

  if (!profile) return { success: false, error: "Profile not found" }
  if (profile.verification_status === "pending") {
    return { success: false, error: "Verification already under review" }
  }
  if (profile.verification_status === "verified") {
    return { success: false, error: "Already verified" }
  }

  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: "pending",
      verification_docs: {
        documentUrl: submission.documentUrl,
        selfieUrl: submission.selfieUrl,
        documentType: submission.documentType,
        submittedAt: new Date().toISOString(),
      },
      verification_rejection_reason: null,
    })
    .eq("id", user.id)

  if (error) return { success: false, error: "Failed to submit verification" }

  revalidatePath("/verification")
  revalidatePath("/dashboard")

  return { success: true }
}

// ─── Admin: Get all pending verifications ────────────────

export async function adminGetPendingVerifications(): Promise<{
  id: string
  full_name: string
  email: string
  university: string
  matric_number: string
  verification_docs: VerificationRecord["verification_docs"]
  verification_status: VerificationStatus
  created_at: string
}[]> {
  const auth = await requireAdmin()
  if (!auth.ok) return []

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, university, matric_number, verification_docs, verification_status, created_at")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data as any
}

// ─── Admin: Get all verifications (all statuses) ─────────

export async function adminGetAllVerifications(status?: VerificationStatus): Promise<{
  id: string
  full_name: string
  email: string
  university: string
  matric_number: string
  verification_docs: VerificationRecord["verification_docs"]
  verification_status: VerificationStatus
  verified_at: string | null
  verification_rejection_reason: string | null
  created_at: string
}[]> {
  const auth = await requireAdmin()
  if (!auth.ok) return []

  const admin = createAdminClient()
  let query = admin
    .from("profiles")
    .select("id, full_name, email, university, matric_number, verification_docs, verification_status, verified_at, verification_rejection_reason, created_at")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("verification_status", status)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as any
}

// ─── Admin: Approve verification ─────────────────────────

export async function adminApproveVerification(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return {
      success: false,
      error: auth.reason === "unauthenticated" ? "Not authenticated" : "Unauthorized",
    }
  }

  if (!isUuid(userId)) return { success: false, error: "Invalid user ID" }

  const admin = createAdminClient()

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (targetError || !target) return { success: false, error: "User not found" }

  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verification_rejection_reason: null,
    })
    .eq("id", target.id)

  if (error) return { success: false, error: "Failed to approve" }

  revalidatePath("/admin/verification")
  return { success: true }
}

// ─── Admin: Reject verification ──────────────────────────

export async function adminRejectVerification(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return {
      success: false,
      error: auth.reason === "unauthenticated" ? "Not authenticated" : "Unauthorized",
    }
  }

  if (!isUuid(userId)) return { success: false, error: "Invalid user ID" }

  const cleanReason = typeof reason === "string" ? reason.trim() : ""
  if (!cleanReason) return { success: false, error: "Rejection reason is required" }
  if (cleanReason.length > MAX_REJECTION_REASON_LENGTH) {
    return {
      success: false,
      error: `Rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or fewer`,
    }
  }

  const admin = createAdminClient()

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (targetError || !target) return { success: false, error: "User not found" }

  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: "rejected",
      verification_rejection_reason: cleanReason,
      verified_at: null,
    })
    .eq("id", target.id)

  if (error) return { success: false, error: "Failed to reject" }

  revalidatePath("/admin/verification")
  return { success: true }
}

// ─── Admin: Get signed URL to view private doc ───────────

export async function adminGetDocumentUrl(
  path: string
): Promise<{ url: string } | { error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return {
      error: auth.reason === "unauthenticated" ? "Not authenticated" : "Unauthorized",
    }
  }

  const parsed = parseDocumentPath(path)
  if (!parsed) return { error: "Invalid document path" }

  const admin = createAdminClient()

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("verification_docs")
    .eq("id", parsed.userId)
    .maybeSingle()

  if (targetError || !target) return { error: "Document not found" }

  const docs = target.verification_docs as
    | { documentUrl?: unknown; selfieUrl?: unknown }
    | null

  const allowedPaths = [
    toStoragePath(docs?.documentUrl),
    toStoragePath(docs?.selfieUrl),
  ].filter((p): p is string => p !== null)

  if (!allowedPaths.includes(path)) return { error: "Document not found" }

  const { data, error } = await admin.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(path, 60 * 10) // 10 min expiry

  if (error || !data) return { error: "Failed to get document URL" }
  return { url: data.signedUrl }
}