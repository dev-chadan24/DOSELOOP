import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * AI transparency label (PRODUCT.md §10 / DESIGN.md §9):
 * every AI-generated surface must be visibly marked as such.
 * Calm, low-key treatment — not a glowing purple gradient.
 */
export function AiBadge({
  className,
  label = "AI summary",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      <Sparkles className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}
