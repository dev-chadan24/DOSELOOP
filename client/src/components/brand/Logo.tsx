import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-7 w-7", text: "text-lg" },
  md: { box: "h-9 w-9", text: "text-xl" },
  lg: { box: "h-11 w-11", text: "text-2xl" },
};

/**
 * DoseLoop mark: an interrupted ring (the "loop") with a steady dot —
 * a calm, never-broken cycle of care. Not a clinical cross, not an AI spark.
 */
export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft",
          s.box,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none">
          <path
            d="M12 4a8 8 0 1 1-6.5 3.3"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn("font-display font-semibold tracking-tight text-foreground", s.text)}>
          DoseLoop
        </span>
      )}
    </span>
  );
}
