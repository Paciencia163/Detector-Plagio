import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "accent";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6 transition-all duration-200 hover:shadow-academic-lg",
        variant === "default" && "bg-card border border-border shadow-academic",
        variant === "primary" && "stat-gradient text-primary-foreground",
        variant === "accent" && "gold-gradient text-accent-foreground"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "opacity-90"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-bold font-display">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-sm",
                variant === "default" ? "text-muted-foreground" : "opacity-80"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <span
                className={cn(
                  "font-medium",
                  trend.value >= 0 ? "text-risk-low" : "text-destructive",
                  variant !== "default" && "opacity-90"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className={variant === "default" ? "text-muted-foreground" : "opacity-70"}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-lg",
            variant === "default" && "bg-primary/10",
            variant !== "default" && "bg-white/20"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              variant === "default" && "text-primary",
              variant !== "default" && "text-current"
            )}
          />
        </div>
      </div>
    </div>
  );
}
