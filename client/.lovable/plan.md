# Profile & Insights visual refresh

Both screens get rebuilt to match the selected directions, translated into DoseLoop's own design tokens (emerald primary, sage, lavender, gold) so they stay on-brand in light + dark. No placeholder names/colors from the prototypes — real data (Suresh Iyer, 4 meds, 3 circle members, 12-day streak) stays.

## 1. Profile card — `src/routes/_app.profile.tsx` ("Warm premium")

- Replace the flat pale-teal banner with a richer **gradient cover** built from brand tokens (emerald → lavender → gold, via `bg-[linear-gradient(...)]` using `--primary`/`--accent`/`--gold`), with the "Account / Your profile" eyebrow + title moved onto the banner in white.
- **Overlapping rounded-square avatar** (rounded-2xl, thick card-colored border) with a small emerald "online" status dot.
- Name + email block below; keep `Edit profile` button (solid primary, rounded-xl, hover lift).
- **Three accent-tinted stat tiles** in a 3-col grid, each with its own colored icon chip:
  - Medications → primary/emerald tint
  - Circle members → lavender tint
  - Day streak → gold/warning tint
  - Centered icon chip, big number (IBM Plex numeric), small uppercase label; subtle border + `card-interactive` hover.
- Keep the existing "Quick links" card below unchanged.

## 2. Insights screen — `src/routes/_app.analytics.tsx` ("Light high-contrast")

- **KPI cards (4):** add a colored rounded icon chip at top (emerald/gold/info/lavender per metric), label above value, value in IBM Plex numeric. Keep current real values (Weekly adherence 89% +4%, Streak 12 days, Hydration 6/8, Sleep 7.2h). Add gentle hover lift.
- **Weekly bar chart — fix + restyle:** the bars currently don't render reliably. Rebuild with an explicit-height plot area and a baseline grid line so bars are always visible. Color-code full days (primary/emerald) vs partial days (gold), rounded tops, grow-up entrance animation, a small "Weekly total" pill in the header, and per-bar value on hover.
- **Weekly insight AI card:** upgrade to a premium dark recommendation card using a deep brand surface with soft emerald/lavender glow blobs, keeping the `AiBadge` (required for AI content) and the existing insight copy.

## Design / token notes (technical)

- All colors use existing semantic tokens (`--primary`, `--accent`, `--gold`, `--success`, `--warning`, `--info`) — no hardcoded hex from prototypes — so both themes work automatically.
- Reuse existing utilities: `card-interactive`, `shadow-soft/lift`, `animate-rise`, `stagger-children`.
- Numbers/stats use the `font-numeric` (IBM Plex Sans) utility already in the design system.
- Fonts already loaded via `__root.tsx`; no new font packages needed.

## Verification

- Playwright screenshots of `/profile` and `/analytics` in both light and dark themes; confirm the weekly bars now render and zero console errors.
