
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GoogleButton } from "@/components/shared/google-button";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser, resendVerificationEmail } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [unverifiedUserId, setUnverifiedUserId] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(undefined);
    setUnverifiedUserId(undefined);
    setResendSuccess(undefined);

    const result = await loginUser(data, redirectTo);

    if (result?.error) {
      setError(result.error);
      if (result.unverified && result.userId) {
        setUnverifiedUserId(result.userId);
      }
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!unverifiedUserId) return;
    setResendLoading(true);
    const result = await resendVerificationEmail(unverifiedUserId);
    if (result.error) {
      setError(result.error);
    } else {
      setResendSuccess(result.message);
    }
    setResendLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-brand-500">CampusWhop</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu.ng"
                  {...register("email")}
                  className={cn(errors.email && "border-destructive")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(errors.password && "border-destructive")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive text-center">{error}</p>
                  {unverifiedUserId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleResend}
                      disabled={resendLoading}
                    >
                      {resendLoading ? "Sending..." : "Resend verification email"}
                    </Button>
                  )}
                  {resendSuccess && (
                    <p className="text-sm text-brand-500 text-center">{resendSuccess}</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-brand-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleButton />

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand-500 hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}