"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "./google-button";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    placeholder: string;
  }>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitText: string;
  footer: React.ReactNode;
  error?: string;
  success?: string;
}

export function AuthForm({
  title,
  subtitle,
  fields,
  onSubmit,
  submitText,
  footer,
  error,
  success,
}: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(error);
  const [formSuccess, setFormSuccess] = useState(success);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      // This is a simplified resolver - actual schemas passed from parent
      require("@/lib/validations/auth").loginSchema
    ),
  });

  const handleFormSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setFormError(undefined);
    setFormSuccess(undefined);

    try {
      await onSubmit(data);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                {...register(field.name)}
                className={cn(
                  errors[field.name] && "border-destructive"
                )}
              />
              {errors[field.name] && (
                <p className="text-sm text-destructive">
                  {errors[field.name]?.message as string}
                </p>
              )}
            </div>
          ))}

          {formError && (
            <p className="text-sm text-destructive text-center">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-sm text-brand-500 text-center">{formSuccess}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : submitText}
          </Button>
        </form>

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

        <div className="text-center text-sm">{footer}</div>
      </CardContent>
    </Card>
  );
}
