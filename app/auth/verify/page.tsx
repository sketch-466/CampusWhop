import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function VerifyPage() {
  return (
    <AuthCard
      title="Check your email"
      subtitle="We sent you a confirmation link"
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-foreground font-medium">
            Confirmation email sent
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Click the link in your email to confirm your account.
            After confirming, you will complete your student profile.
          </p>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Did not receive the email? Check your spam folder. The link
            expires in 24 hours.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
