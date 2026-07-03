import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-zinc-800 text-zinc-300": variant === "default",
          "bg-emerald-900 text-emerald-400": variant === "success",
          "bg-yellow-900 text-yellow-400": variant === "warning",
          "bg-red-900 text-red-400": variant === "destructive",
          "border border-zinc-700 text-zinc-400": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
