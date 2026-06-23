import { BadgeCheck, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "unverified";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({
  status,
  size = "md",
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  const sizeMap = {
    sm: { icon: 12, container: "h-4 w-4" },
    md: { icon: 14, container: "h-5 w-5" },
    lg: { icon: 18, container: "h-6 w-6" },
  };

  const config = {
    verified: {
      icon: BadgeCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      label: "Verified Student",
      glow: "drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]",
    },
    pending: {
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "Pending Verification",
      glow: "",
    },
    unverified: {
      icon: Shield,
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
      label: "Unverified",
      glow: "",
    },
  };

  const { icon: Icon, color, bg, border, label, glow } = config[status];
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border",
          s.container,
          bg,
          border,
          glow
        )}
      >
        <Icon className={color} size={s.icon} />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", color)}>{label}</span>
      )}
    </div>
  );
}
