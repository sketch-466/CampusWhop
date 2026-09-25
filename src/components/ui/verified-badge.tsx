import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showLabel?: boolean
}

export function VerifiedBadge({
  size = "md",
  className,
  showLabel = false,
}: VerifiedBadgeProps) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-emerald-400",
        className
      )}
      title="Verified FUNAI Student"
    >
      <BadgeCheck className={cn(sizes[size], "fill-emerald-400 text-zinc-900")} />
      {showLabel && (
        <span className="text-xs font-medium text-emerald-400">Verified</span>
      )}
    </span>
  )
}