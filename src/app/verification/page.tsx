"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
  BookOpen,
  Loader2,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getVerificationUploadUrl,
  submitVerification,
  getVerificationStatus,
} from "@/lib/actions/verification"
import { useEffect } from "react"

type DocumentType =
  | "admission_letter"
  | "student_id"
  | "fees_receipt"
  | "course_registration"

const DOCUMENT_TYPES = [
  {
    value: "admission_letter" as DocumentType,
    label: "Admission Letter",
    description: "FUNAI admission letter (any year)",
    icon: FileText,
  },
  {
    value: "student_id" as DocumentType,
    label: "Student ID Card",
    description: "FUNAI student ID (front face)",
    icon: CreditCard,
  },
  {
    value: "fees_receipt" as DocumentType,
    label: "School Fees Receipt",
    description: "Current or recent session receipt",
    icon: Receipt,
  },
  {
    value: "course_registration" as DocumentType,
    label: "Course Registration Form",
    description: "Printout from FUNAI portal",
    icon: BookOpen,
  },
]

type UploadState = {
  file: File | null
  preview: string | null
  uploading: boolean
  uploaded: boolean
  path: string | null
  error: string | null
}

const defaultUpload: UploadState = {
  file: null,
  preview: null,
  uploading: false,
  uploaded: false,
  path: null,
  error: null,
}

export default function VerificationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [docType, setDocType] = useState<DocumentType | null>(null)
  const [docUpload, setDocUpload] = useState<UploadState>(defaultUpload)
  const [selfieUpload, setSelfieUpload] = useState<UploadState>(defaultUpload)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)

  const docInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getVerificationStatus().then((result) => {
      if (!result) return
      if (result.status === "pending") {
        router.replace("/verification/pending")
      }
      if (result.status === "verified") {
        router.replace("/dashboard")
      }
      if (result.status === "rejected") {
        setExistingStatus("rejected")
      }
    })
  }, [router])

  async function uploadFile(
    file: File,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ) {
    setter((p) => ({ ...p, uploading: true, error: null }))

    const result = await getVerificationUploadUrl(file.name, file.type)
    if ("error" in result) {
      setter((p) => ({ ...p, uploading: false, error: result.error }))
      return
    }

    const { path, signedUploadUrl } = result

    const res = await fetch(signedUploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    })

    if (!res.ok) {
      setter((p) => ({ ...p, uploading: false, error: "Upload failed. Try again." }))
      return
    }

    setter((p) => ({ ...p, uploading: false, uploaded: true, path }))
  }

  function handleDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setDocUpload((p) => ({ ...p, error: "File too large. Max 10MB." }))
      return
    }
    const preview = URL.createObjectURL(file)
    setDocUpload({ file, preview, uploading: false, uploaded: false, path: null, error: null })
    uploadFile(file, setDocUpload)
  }

  function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setSelfieUpload((p) => ({ ...p, error: "File too large. Max 10MB." }))
      return
    }
    const preview = URL.createObjectURL(file)
    setSelfieUpload({ file, preview, uploading: false, uploaded: false, path: null, error: null })
    uploadFile(file, setSelfieUpload)
  }

  async function handleSubmit() {
    if (!docType || !docUpload.path || !selfieUpload.path) return
    setSubmitting(true)
    setSubmitError(null)

    const result = await submitVerification({
      documentUrl: docUpload.path,
      selfieUrl: selfieUpload.path,
      documentType: docType,
    })

    if (!result.success) {
      setSubmitError(result.error || "Submission failed")
      setSubmitting(false)
      return
    }

    router.replace("/verification/pending")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs text-emerald-400 font-medium mb-4">
            <CheckCircle2 className="h-3 w-3" />
            Student Verification
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Verify your student identity
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            To list products or offer services on CampusWhop, we need to confirm
            you're a real FUNAI student. This protects all buyers on the platform.
          </p>
        </div>

        {/* Rejected banner */}
        {existingStatus === "rejected" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Previous submission rejected</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                Please resubmit with a clearer document and selfie.
              </p>
            </div>
          </div>
        )}

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s
                    ? "bg-emerald-500 text-zinc-900"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-px w-8 transition-colors ${
                    step > s ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-zinc-500">
            {step === 1 && "Choose document type"}
            {step === 2 && "Upload documents"}
            {step === 3 && "Review & submit"}
          </span>
        </div>

        {/* STEP 1 — Choose document type */}
        {step === 1 && (
          <div>
            <p className="text-sm text-zinc-400 mb-4">
              Choose <span className="text-white font-medium">one</span> document you have access to:
            </p>
            <div className="space-y-3">
              {DOCUMENT_TYPES.map((type) => {
                const Icon = type.icon
                const selected = docType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => setDocType(type.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? "bg-emerald-500/20" : "bg-zinc-800"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          selected ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          selected ? "text-white" : "text-zinc-300"
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!docType}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — Upload files */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Document upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                {DOCUMENT_TYPES.find((d) => d.value === docType)?.label}
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Clear photo or scan — all text must be readable
              </p>
              <input
                ref={docInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleDocFile}
              />
              {!docUpload.file ? (
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-zinc-600 transition-colors"
                >
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-sm text-zinc-500">Tap to upload</span>
                  <span className="text-xs text-zinc-600">JPG, PNG or PDF · Max 10MB</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                  {docUpload.preview && docUpload.file?.type.startsWith("image/") && (
                    <Image
                      src={docUpload.preview}
                      alt="Document preview"
                      width={600}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {docUpload.file?.type === "application/pdf" && (
                    <div className="h-24 bg-zinc-800 flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-zinc-400" />
                      <span className="text-sm text-zinc-400">{docUpload.file.name}</span>
                    </div>
                  )}
                  <div className="p-3 bg-zinc-900 flex items-center justify-between">
                    {docUpload.uploading && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                      </span>
                    )}
                    {docUpload.uploaded && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                    {docUpload.error && (
                      <span className="text-xs text-red-400">{docUpload.error}</span>
                    )}
                    <button
                      onClick={() => {
                        setDocUpload(defaultUpload)
                        if (docInputRef.current) docInputRef.current.value = ""
                      }}
                      className="ml-auto text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selfie upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Selfie holding the document
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Your face and the document must both be clearly visible
              </p>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieFile}
              />
              {!selfieUpload.file ? (
                <button
                  onClick={() => selfieInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-zinc-600 transition-colors"
                >
                  <Camera className="h-6 w-6 text-zinc-500" />
                  <span className="text-sm text-zinc-500">Take selfie or upload photo</span>
                  <span className="text-xs text-zinc-600">JPG or PNG · Max 10MB</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                  {selfieUpload.preview && (
                    <Image
                      src={selfieUpload.preview}
                      alt="Selfie preview"
                      width={600}
                      height={300}
                      className="w-full h-48 object-cover object-top"
                    />
                  )}
                  <div className="p-3 bg-zinc-900 flex items-center justify-between">
                    {selfieUpload.uploading && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                      </span>
                    )}
                    {selfieUpload.uploaded && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                    {selfieUpload.error && (
                      <span className="text-xs text-red-400">{selfieUpload.error}</span>
                    )}
                    <button
                      onClick={() => {
                        setSelfieUpload(defaultUpload)
                        if (selfieInputRef.current) selfieInputRef.current.value = ""
                      }}
                      className="ml-auto text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-zinc-700 text-zinc-300 font-medium py-3 rounded-xl hover:border-zinc-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!docUpload.uploaded || !selfieUpload.uploaded}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Review & submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Review your submission</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Document type</span>
                <span className="text-xs text-white font-medium">
                  {DOCUMENT_TYPES.find((d) => d.value === docType)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Document</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Uploaded
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Selfie</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Uploaded
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
              By submitting, you confirm these documents belong to you and
              you are a current FUNAI student. Submitting fraudulent documents
              will result in a permanent account ban.
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex-1 border border-zinc-700 text-zinc-300 font-medium py-3 rounded-xl hover:border-zinc-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}