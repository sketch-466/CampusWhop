"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { loginAction } from "@/lib/auth/actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your CampusWhop account"
    >
      <form action={formAction} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-destructive text-sm">{state.error}</p>
          </div>
        )}

        <SubmitButton label="Sign In" loadingLabel="Signing in..." />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Create one free
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
