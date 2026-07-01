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
import { cn } from "@/lib/utils";

const NIGERIAN_UNIVERSITIES = [
  "Federal University Ndufu-Alike Ikwo (FUNAI)",
  "University of Nigeria, Nsukka (UNN)",
  "Nnamdi Azikiwe University, Awka (UNIZIK)",
  "Ebonyi State University, Abakaliki (EBSU)",
  "Enugu State University of Science and Technology (ESUT)",
  "Imo State University, Owerri (IMSU)",
  "Abia State University, Uturu (ABSU)",
  "Anambra State University, Uli (ANSU)",
  "Federal University of Technology, Owerri (FUTO)",
  "Michael Okpara University of Agriculture, Umudike (MOUAU)",
];

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
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: defaultFullName,
      university: NIGERIAN_UNIVERSITIES[0], // FUNAI as default
    },
  });

  const selectedUniversity = watch("university");

  const onSubmit = async (data: OnboardingInput) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await completeOnboarding({
        fullName: data.fullName,
        university: data.university,
        matricNumber: data.matricNumber,
        phoneNumber: data.phoneNumber,
      });

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
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
              {NIGERIAN_UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
            {errors.university && (
              <p className="text-sm text-destructive">
                {errors.university.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="matricNumber">Matric Number</Label>
            <Input
              id="matricNumber"
              placeholder="e.g., 2019/123456"
              {...register("matricNumber")}
              className={cn(errors.matricNumber && "border-destructive")}
            />
            {errors.matricNumber && (
              <p className="text-sm text-destructive">
                {errors.matricNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              placeholder="e.g., +234 801 234 5678"
              {...register("phoneNumber")}
              className={cn(errors.phoneNumber && "border-destructive")}
            />
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
