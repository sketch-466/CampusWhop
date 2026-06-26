"use client";

import { useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { onboardingAction } from "@/lib/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState = { error: "" };

const DEPARTMENTS = [
  "Agricultural Science and Education",
  "Biochemistry",
  "Biological Sciences",
  "Chemical Sciences",
  "Civil Engineering",
  "Computer Science",
  "Economics",
  "Education and Biology",
  "Education and Chemistry",
  "Education and Mathematics",
  "Electrical/Electronic Engineering",
  "English and Literary Studies",
  "Environmental Management",
  "History and International Studies",
  "Industrial Chemistry",
  "Law",
  "Mass Communication",
  "Mathematics",
  "Mechanical Engineering",
  "Medicine and Surgery",
  "Microbiology",
  "Nursing Science",
  "Physics",
  "Political Science",
  "Psychology",
  "Public Administration",
  "Sociology",
];

const LEVELS = ["100", "200", "300", "400", "500", "600"];

interface University {
  id: string;
  name: string;
  short_name: string;
}

export default function OnboardingPage() {
  const [state, formAction] = useActionState(onboardingAction, initialState);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUniversities() {
      const supabase = createClient();
      const { data } = await supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("is_active", true)
        .order("name");

      if (data) setUniversities(data);
      setLoading(false);
    }
    fetchUniversities();
  }, []);

  return (
    <AuthCard
      title="Complete your profile"
      subtitle="This helps other students know who they are dealing with"
    >
      <form action={formAction} className="space-y-4">

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="yourname"
              maxLength={20}
              className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            3-20 characters, letters, numbers and underscores only
          </p>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Phone Number{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08012345678"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* University */}
        <div>
          <label
            htmlFor="university_id"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            University
          </label>
          <select
            id="university_id"
            name="university_id"
            required
            disabled={loading}
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            <option value="">
              {loading ? "Loading universities..." : "Select your university"}
            </option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.short_name} — {uni.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Department
          </label>
          <select
            id="department"
            name="department"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label
            htmlFor="level"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Level
          </label>
          <select
            id="level"
            name="level"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          >
            <option value="">Select your level</option>
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl} Level
              </option>
            ))}
          </select>
        </div>

        {/* Matric Number */}
        <div>
          <label
            htmlFor="matric_number"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Matric Number{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="matric_number"
            name="matric_number"
            type="text"
            placeholder="e.g. FUNAI/2021/001234"
            className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Error */}
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-destructive text-sm">{state.error}</p>
          </div>
        )}

        <SubmitButton
          label="Complete Profile"
          loadingLabel="Saving profile..."
        />

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Your information helps build trust with other students on CampusWhop.
        </p>
      </form>
    </AuthCard>
  );
}
