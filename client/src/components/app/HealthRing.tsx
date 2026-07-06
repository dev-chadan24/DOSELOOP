import { cn } from "@/lib/utils";

const colorMap = {
  primary: "var(--color-primary)",
  info: "var(--color-info)",
  gold: "var(--color-gold)",
} as const;

export function HealthRing({
  value,
  goal,
  label,
  unit,
  color = "primary",
  size = 92,
  stroke = 9,
  className,
}: {
  value: number;
  goal: number;
  label?: string;
  unit?: string;
  color?: keyof typeof colorMap;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colorMap[color]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-numeric text-lg font-semibold leading-none text-foreground">
            {value}
            <span className="text-xs text-muted-foreground">/{goal}</span>
          </span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
        </div>
      )}
    </div>
  );
}
