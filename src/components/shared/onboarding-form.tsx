"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/auth";
import { completeOnboarding } from "@/lib/actions/auth";
import {
  MATRIC_FORMATS,
  SUPPORTED_INSTITUTIONS,
  getInstitutionKey,
  validateMatric,
} from "@/lib/institutions/matric";
import { cn } from "@/lib/utils";

interface OnboardingFormProps {
  defaultFullName?: string;
}

export function OnboardingForm({ defaultFullName = "" }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError: setFieldError,
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: defaultFullName,
      university: SUPPORTED_INSTITUTIONS[0].name,
      matricNumber: "",
      phoneNumber: "",
    },
  });

  const selectedUniversity = watch("university");
  const institutionKey = getInstitutionKey(selectedUniversity);
  const matricFormat = institutionKey ? MATRIC_FORMATS[institutionKey] : null;

  const onSubmit = async (data: OnboardingInput) => {
    setError(undefined);

    // UX-only check. The server action remains authoritative.
    const key = getInstitutionKey(data.university);
    if (!key) {
      setFieldError("university", { message: "Unsupported university" });
      return;
    }
    const check = validateMatric(key, data.matricNumber);
    if (!check.ok) {
      setFieldError("matricNumber", { message: check.error });
      return;
    }

    setIsLoading(true);

    const result = await completeOnboarding({
      fullName: data.fullName,
      university: data.university,
      matricNumber: check.value,
      phoneNumber: data.phoneNumber || undefined,
    });

    if (result?.error) {
      if (result.error.includes("profiles_matric_number_unique")) {
        setError("This matric number is already registered to another account.");
      } else if (result.error.includes("profiles_phone_number_unique")) {
        setError("This phone number is already registered to another account.");
      } else if (result.error.includes("profiles_matric_format_check")) {
        setError(
          matricFormat?.errorMessage ?? "Invalid matric number format."
        );
      } else if (result.error.includes("profiles_phone_format_check")) {
        setError("Invalid phone number format. Use 08012345678 or +2348012345678.");
      } else if (result.error.includes("deleted account")) {
        setError("This matric number or phone number is associated with a deleted account. Contact support.");
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Complete Your Profile
        </CardTitle>
        <CardDescription>
          Tell us about yourself to unlock all CampusWhop features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              {...register("fullName")}
              className={cn(errors.fullName && "border-destructive")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <select
              id="university"
              {...register("university")}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.university && "border-destructive"
              )}
              value={selectedUniversity}
              onChange={(e) => setValue("university", e.target.value)}
            >
              {SUPPORTED_INSTITUTIONS.map((uni) => (
                <option key={uni.key} value={uni.name}>
                  {uni.name}
                </option>
              ))}
            </select>
            {errors.university && (
              <p className="text-sm text-destructive">
                {errors.university.message}
              </p>
            )}
          </div>

          {/* Matric Number */}
          <div className="space-y-2">
            <Label htmlFor="matricNumber">Matric Number</Label>
            <Input
              id="matricNumber"
              placeholder={`e.g. ${matricFormat?.placeholder ?? ""}`}
              autoCapitalize="characters"
              {...register("matricNumber")}
              className={cn(errors.matricNumber && "border-destructive")}
            />
            {matricFormat && (
              <p className="text-xs text-muted-foreground">
                {matricFormat.helpText}
              </p>
            )}
            {errors.matricNumber && (
              <p className="text-sm text-destructive">
                {errors.matricNumber.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number{" "}
              <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="phoneNumber"
              placeholder="e.g. 08012345678"
              type="tel"
              inputMode="numeric"
              {...register("phoneNumber")}
              className={cn(errors.phoneNumber && "border-destructive")}
            />
            <p className="text-xs text-muted-foreground">
              Nigerian number only — used for order notifications
            </p>
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}