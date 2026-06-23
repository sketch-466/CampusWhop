"use client";

import { useState } from "react";
import { BookOpen, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseFilterProps {
  courses: { id: string; code: string; title: string }[];
  selectedCourse: string | null;
  onSelect: (courseId: string | null) => void;
}

export function CourseFilter({ courses, selectedCourse, onSelect }: CourseFilterProps) {
  const [expanded, setExpanded] = useState(false);

  if (courses.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          Your Courses
        </h3>
        {selectedCourse && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {courses.slice(0, expanded ? courses.length : 4).map((course) => (
          <button
            key={course.id}
            onClick={() => onSelect(selectedCourse === course.id ? null : course.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              selectedCourse === course.id
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/20 hover:text-foreground"
            )}
          >
            {course.code}
          </button>
        ))}
        {!expanded && courses.length > 4 && (
          <button
            onClick={() => setExpanded(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground"
          >
            +{courses.length - 4} more
          </button>
        )}
      </div>

      {selectedCourse && (
        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-[11px] text-emerald-400">
            Showing items linked to this course. Members get priority visibility.
          </p>
        </div>
      )}
    </div>
  );
}
