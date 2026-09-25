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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!adminCheck?.is_admin) return []

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!adminCheck?.is_admin) return []

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!adminCheck?.is_admin) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verification_rejection_reason: null,
    })
    .eq("id", userId)

  if (error) return { success: false, error: "Failed to approve" }

  revalidatePath("/admin/verification")
  return { success: true }
}

// ─── Admin: Reject verification ──────────────────────────

export async function adminRejectVerification(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!adminCheck?.is_admin) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: "rejected",
      verification_rejection_reason: reason,
      verified_at: null,
    })
    .eq("id", userId)

  if (error) return { success: false, error: "Failed to reject" }

  revalidatePath("/admin/verification")
  return { success: true }
}

// ─── Admin: Get signed URL to view private doc ───────────

export async function adminGetDocumentUrl(
  path: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!adminCheck?.is_admin) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from("verification-docs")
    .createSignedUrl(path, 60 * 10) // 10 min expiry

  if (error || !data) return { error: "Failed to get document URL" }
  return { url: data.signedUrl }
}