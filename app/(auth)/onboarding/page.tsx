"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, GraduationCap, Briefcase, Store, User } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science",
  "Engineering",
  "Medicine",
  "Law",
  "Business Administration",
  "Economics",
  "Mass Communication",
  "Political Science",
  "Biochemistry",
  "Microbiology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Sociology",
  "Other",
];

const LEVELS = ["100", "200", "300", "400", "500"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        department,
        level,
        matric_number: matricNumber,
        phone,
        user_type: userType,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
    router.refresh();
  };

  const userTypes = [
    { id: "student", label: "Student", icon: User, desc: "Find jobs & opportunities" },
    { id: "entrepreneur", label: "Entrepreneur", icon: Store, desc: "Sell products & services" },
    { id: "employer", label: "Employer", icon: Briefcase, desc: "Post jobs & hire students" },
  ];

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <CardTitle className="text-xl">Complete your profile</CardTitle>
        <CardDescription className="text-muted-foreground">
          Step {step} of 2 — Tell us about yourself
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-1 gap-3">
                {userTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setUserType(type.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      userType === type.id
                        ? "border-emerald-500/50 bg-emerald-500/10 glow-emerald"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <type.icon className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl} Level
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="matric">Matric Number</Label>
              <Input
                id="matric"
                placeholder="e.g., 2020/123456"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={loading || !department || !level}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
