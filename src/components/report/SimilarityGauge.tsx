import { cn } from "@/lib/utils";

interface SimilarityGaugeProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SimilarityGauge({
  percentage,
  size = "md",
  showLabel = true,
}: SimilarityGaugeProps) {
  const getRiskLevel = (pct: number) => {
    if (pct <= 15) return { level: "low", label: "Baixo", color: "hsl(142, 71%, 45%)" };
    if (pct <= 30) return { level: "medium", label: "Médio", color: "hsl(38, 92%, 50%)" };
    return { level: "high", label: "Alto", color: "hsl(0, 72%, 51%)" };
  };

  const risk = getRiskLevel(percentage);

  const sizes = {
    sm: { container: "w-24 h-24", text: "text-xl", label: "text-xs" },
    md: { container: "w-40 h-40", text: "text-4xl", label: "text-sm" },
    lg: { container: "w-56 h-56", text: "text-5xl", label: "text-base" },
  };

  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = size === "sm" ? 40 : size === "md" ? 65 : 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size].container)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={risk.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            animation: "progress-ring 1.5s ease-out forwards",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold font-display", sizes[size].text)} style={{ color: risk.color }}>
          {percentage}%
        </span>
        {showLabel && (
          <span className={cn("text-muted-foreground font-medium", sizes[size].label)}>
            Similaridade
          </span>
        )}
      </div>
    </div>
  );
}
