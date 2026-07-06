# DESIGN

> This document is DoseLoop's Design Bible: the single source of truth for visual and interaction decisions. If a screen contradicts this document, the screen is wrong, not the document — exceptions are made by updating this document first, not by drifting silently in implementation. Cross-references: `PRODUCT.md` for the requirements being designed for, `ARCHITECTURE.md` for how components are technically composed, `DEVELOPMENT.md` for the QA checklist that verifies visual conformance.

## 1. Branding Direction

DoseLoop should feel like it belongs on the same home screen as Apple Health, Things, and Notion — not like a generic healthcare SaaS dashboard. The brand impression to aim for is: **calm competence**. Not playful, not clinical, not corporate. The product should feel like a quietly capable assistant, never an alarm system.

Explicitly avoid: purple-gradient "AI" branding, stock medical iconography (crosses, stethoscopes, generic pill bottles as decoration), dashboard clutter, and overuse of cards-on-cards layouts with no hierarchy.

## 2. Logo Philosophy

The name "DoseLoop" suggests two ideas worth reflecting visually: a recurring cycle (the "loop" of daily habits) and precision (the "dose"). A mark built from a simple, continuous looped form — rendered as a single clean line rather than a literal pill or cross — would communicate routine and reliability without leaning on medical clichés. The logo should work as a small monochrome app icon first; color and detail are secondary.

## 3. Typography

- **Primary typeface:** A humanist sans-serif with excellent legibility at small sizes and warmth at large sizes — e.g., Inter or a comparable system font (San Francisco on Apple platforms, Segoe on Windows) as fallback, to keep the product feeling native rather than skinned.
- **Scale:** Use a restrained type scale (e.g., 12 / 14 / 16 / 20 / 24 / 32 / 40px) rather than ad hoc sizes, so vertical rhythm stays consistent across screens.
- **Weight usage:** Reserve bold weights for true hierarchy (page titles, key numbers like adherence %); body copy stays regular weight for calm readability.
- **Elderly-user consideration:** Body text should default no smaller than 16px, with a user-adjustable text size setting given the elderly persona's needs.

## 4. Color Palette

The palette should be built around a single confident primary color plus a neutral grayscale — not a multi-gradient "AI" aesthetic.

- **Primary:** A deep, trustworthy blue-teal (e.g., a desaturated teal in the `#0F6E6B`–`#127A77` range) — associated with calm and health without being sterile clinical blue or cliché medical green.
- **Neutrals:** A warm gray scale (not pure black/white) for backgrounds and text, to soften the clinical feel — background near `#FAFAF9`, primary text near `#1C1B1A`.
- **Semantic colors, used sparingly and only functionally:**
  - Success/adherence: muted green
  - Warning/missed dose: warm amber, never alarming red as a default state
  - Critical/emergency only: a single reserved red, used nowhere else in the UI so it retains meaning
- **Reasoning:** Color should carry meaning, not decoration. If everything is colorful, nothing communicates urgency. Reserving red exclusively for true emergencies is a deliberate trust mechanism — a red badge in DoseLoop should always mean something real.

## 5. Spacing System

Use an 8px base spacing unit (4px allowed for fine adjustments only). Consistent spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64. This keeps density predictable across a data-heavy app and prevents the "generic AI dashboard" feel that comes from inconsistent padding.

## 6. Iconography

Use a single consistent icon set (line-style, consistent stroke width — e.g., Lucide, which is already available via the shadcn ecosystem) throughout. Icons should be functional wayfinding tools, not decoration: every icon should have a clear, learnable meaning (e.g., one consistent icon for "medication," one for "wellness," one for "Circle") used identically everywhere it appears.

## 7. Component Principles

- **Built on shadcn/ui primitives**, customized to the DoseLoop palette and spacing — not used at default Tailwind/shadcn styling, which immediately reads as "generic AI app."
- **Cards earn their borders.** Avoid wrapping every piece of content in a bordered card; use whitespace and typographic hierarchy first, borders only where grouping genuinely aids comprehension.
- **One primary action per screen.** Each view should have a clear, single emphasized action (e.g., "Log dose") with secondary actions visually subordinate.
- **Status communicated through synthesis, not raw data.** Circle views show "Dad's on track" rather than a raw table — components should be designed to summarize before they display detail.

## 8. Motion Language

Motion in DoseLoop communicates state change and continuity — it is never decorative. Framer Motion is the implementation tool (see `ARCHITECTURE.md` §2); this section defines the rules that govern any animation regardless of how it's built.

- **Purposeful only.** Every animation must answer "what changed, or what's about to change?" If it doesn't, cut it.
- **Timing:** Micro-interactions (checkmarks, toggles, dose-logged confirmation) run 150–250ms. Navigation transitions (page/route changes) run 200–300ms. Nothing in the core flows exceeds 400ms — DoseLoop should never feel like it's making the user wait on a flourish.
- **Easing:** Use standard ease-out curves for elements entering/responding to user action, ease-in for elements leaving. Avoid bouncy, springy, or playful easing curves — this is a calm health product, not a game or a consumer social app.
- **Restraint as a brand signal.** A consistently restrained motion language is itself part of "calm competence" (§1) — DoseLoop should feel more still than the average app, not more animated.
- **Reduced motion.** `prefers-reduced-motion` is respected without exception; reduced-motion users get instant state changes with no transition, never a degraded but still-animated fallback.

## 9. Accessibility Standards

- WCAG 2.1 AA minimum contrast ratios across all text and meaningful UI elements.
- Minimum 44×44px tap targets, especially relevant given the elderly persona.
- No information conveyed by color alone — always pair color with icon and/or text label (e.g., missed dose = amber color + warning icon + "Missed" text).
- Full keyboard navigability and screen-reader labeling for all interactive elements.
- Adjustable text size setting, persisted per user.
- All AI-generated content (digests, nudges, answers — see `PRODUCT.md` §10) is visually labeled distinctly from human/system content, both for transparency and so screen readers announce it accurately.
- Accessibility conformance is a release gate, not a backlog item — see `DEVELOPMENT.md` §8 (Definition of Done) and §10 (Release Workflow).

## 10. Responsive Design Strategy

Mobile-first, since most usage (reminders, quick logging) happens on a phone. Desktop/tablet views should not simply stretch the mobile layout — they should take advantage of width for the Circle dashboard and trend views (e.g., side-by-side family member cards) while keeping single-action mobile flows simple and linear.

## 11. Interaction Design

- Logging a dose should be achievable in one tap from a notification, without opening the full app where possible.
- Destructive actions (deleting a medication, leaving a Circle) require explicit confirmation.
- The AI assistant should be reachable from a consistent, unobtrusive entry point (not a default floating chat bubble pattern) — it surfaces proactively via the daily digest and nudges, and is available on-demand without dominating the interface.
- **Notification visual treatment** follows the Notification Escalation Matrix in `PRODUCT.md` §9: reminders use neutral primary-color treatment, missed-dose nudges use amber with an icon + label (never color alone, per §9 above), and only true Circle-level emergency check-ins use the single reserved red defined in §4. This mapping must stay synchronized with the Product Notification Philosophy — a new escalation tier in `PRODUCT.md` requires a corresponding visual tier here.

## 12. Premium Visual Language

Premium, here, means restraint: generous whitespace, a tight color and type system, consistent spacing, and motion that earns its place. It does not mean visual richness for its own sake — gradients, glow effects, or heavy shadows should be avoided in favor of clarity. Subtle glassmorphism (light blur + transparency) may be used sparingly for elevated surfaces like modals or the AI assistant panel, never as a default card treatment throughout the app.

## 13. Design Philosophy Summary

Every screen in DoseLoop should pass one test: does this reduce the user's cognitive and emotional load, or add to it? A feature that is technically accurate but visually anxious (red everywhere, dense tables, constant notifications) fails this test even if the underlying logic is correct. Calm, legible, and trustworthy beats impressive, busy, and clever — every time.
