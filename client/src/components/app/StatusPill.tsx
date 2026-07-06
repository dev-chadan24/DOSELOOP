import { cn } from "@/lib/utils";

const tones = {
  "on-track": "bg-success/12 text-success border-success/25",
  taken: "bg-success/12 text-success border-success/25",
  attention: "bg-warning/15 text-warning-foreground border-warning/35",
  due: "bg-warning/15 text-warning-foreground border-warning/35",
  snoozed: "bg-info/12 text-info border-info/25",
  quiet: "bg-muted text-muted-foreground border-border",
  upcoming: "bg-muted text-muted-foreground border-border",
  skipped: "bg-destructive/10 text-destructive border-destructive/25",
} as const;

export type StatusTone = keyof typeof tones;

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
