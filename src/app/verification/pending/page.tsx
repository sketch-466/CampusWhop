import { Clock, CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"

export default function VerificationPendingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Verification under review
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          We've received your documents. Our team will review your submission
          within <span className="text-white font-medium">24–48 hours</span>.
          You'll be notified once approved.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-3 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-zinc-300">Documents submitted</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-sm text-zinc-300">Admin review in progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full border border-zinc-700 shrink-0" />
            <span className="text-sm text-zinc-500">Verified badge awarded</span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 mb-6">
          While you wait, you can still browse the marketplace and discover opportunities.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/marketplace"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/dashboard"
            className="w-full text-zinc-500 hover:text-zinc-400 text-sm py-2 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}