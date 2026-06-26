import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className={cn(
        "w-full max-w-md",
        "bg-card border border-border rounded-xl p-8",
        "shadow-xl",
        className
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <span className="text-foreground font-bold text-lg">CampusWhop</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
