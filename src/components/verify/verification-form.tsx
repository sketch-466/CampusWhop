"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface VerificationFormProps {
  userId: string;
}

export function VerificationForm({ userId }: VerificationFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [studentIdImage, setStudentIdImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStudentIdImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Upload student ID image
      if (!studentIdImage) return;

      const fileExt = studentIdImage.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-ids")
        .upload(fileName, studentIdImage);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("verification-ids").getPublicUrl(fileName);

      // Create verification request
      const { error: dbError } = await supabase
        .from("verification_requests")
        .insert({
          user_id: userId,
          student_id_image_url: publicUrl,
          status: "pending",
        });

      if (dbError) throw dbError;

      // Update profile
      await supabase
        .from("profiles")
        .update({
          university,
          department,
          matric_number: matricNumber,
          verification_status: "pending",
        })
        .eq("id", userId);

      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-3">
          Verification Submitted!
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Your student ID has been uploaded and is under review. You'll be notified
          within 24 hours. In the meantime, you can browse the marketplace.
        </p>
        <div className="flex items-center gap-2 justify-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 max-w-md mx-auto">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>You cannot sell or create courses until verified</span>
        </div>
        <Button
          className="mt-6 bg-emerald-600 hover:bg-emerald-500"
          onClick={() => router.push("/feed")}
        >
          Browse CampusWhop
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Student ID Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Upload Student ID Card
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-emerald-500/50",
                previewUrl
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Student ID preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Upload className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">University</Label>
              <Input
                placeholder="e.g. University of Lagos"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="bg-muted/50 border-border focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Department</Label>
              <Input
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-muted/50 border-border focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Matric Number</Label>
            <Input
              placeholder="e.g. 19/52HA001"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="bg-muted/50 border-border focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            disabled={!studentIdImage || !university || !matricNumber}
            onClick={() => setStep(2)}
          >
            Continue to Email Verification
          </Button>
        </div>
      )}

      {/* Step 2: Email Verification */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Student Email (.edu.ng)
            </Label>
            <Input
              type="email"
              placeholder="you@school.edu.ng"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="bg-muted/50 border-border focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-muted-foreground">
              We'll send a verification link to confirm your student status
            </p>
          </div>

          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
            <h4 className="text-sm font-medium text-emerald-400 mb-2">
              Why verification matters
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Prevents scams and fake sellers
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Builds trust in every transaction
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Unlocks selling and course creation
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border hover:bg-muted"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              disabled={!studentEmail.includes(".edu.ng") || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
