# DEVELOPMENT

> Cross-references: `PRODUCT.md` for what is being built, `DESIGN.md` for the visual contract this workflow protects, `ARCHITECTURE.md` for the technical structure these conventions apply to.

## 1. Coding Standards

- TypeScript strict mode enabled across frontend, backend, and shared packages — no `any` without explicit justification in a comment.
- Functions and modules should do one thing; prefer small, composable functions over large multi-purpose ones, especially in `services/`.
- All shared types (API request/response shapes) live in `packages/shared` and are imported by both frontend and backend — never duplicated by hand.
- Prettier + ESLint enforced via pre-commit hook and CI; no unformatted or lint-failing code is merged.
- Comments explain *why*, not *what* — code should be legible enough that *what* is self-evident.

## 2. Naming Conventions

- **Components:** PascalCase (`DoseCard.tsx`).
- **Hooks:** camelCase prefixed with `use` (`useMedications.ts`).
- **Services/utilities:** camelCase (`medicationService.ts`, `formatAdherence.ts`).
- **Database models (Prisma):** PascalCase singular (`Medication`, `DoseLog`), matching Prisma convention.
- **API routes:** kebab-case, resource-oriented, plural nouns (`/medications`, `/wellness-entries`).
- **Branches:** see §4.
- **Environment variables:** SCREAMING_SNAKE_CASE, prefixed by concern where helpful (`GROQ_API_KEY`, `DATABASE_URL`).

## 3. Git Workflow

- Trunk-based with short-lived feature branches off `main`.
- Every change goes through a pull request — no direct commits to `main`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) to keep history scannable and to support automated changelog generation later.
- PRs should be small enough to review in one sitting; large features are broken into incremental, independently mergeable PRs behind feature flags where needed.

## 4. Branching Strategy

```
main                # always deployable, maps to staging
feature/<slug>      # new functionality, e.g. feature/medication-reminders
fix/<slug>          # bug fixes
chore/<slug>        # tooling, deps, non-feature work
docs/<slug>         # documentation-only changes
```

Production deploys are a manual promotion from `main` after staging verification — never an automatic deploy straight from a feature branch.

## 5. Environment Variable Standards

- `.env.example` is kept up to date in the repo root and mirrors every variable required to run the app locally — no undocumented env vars.
- Required variables include at minimum: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, `SESSION_SECRET`.
- Secrets are never committed; local `.env` is gitignored. Production/staging secrets are managed via Vercel's environment variable dashboard, scoped per environment.

## 6. Testing Strategy

- **Unit tests** for service-layer business logic (adherence calculations, RBAC permission filtering per `ARCHITECTURE.md` §13, AI prompt construction) — this layer carries the most risk and should have the highest coverage.
- **Integration tests** for API routes against a real Neon test branch (via Prisma), covering auth, permission boundaries, and core CRUD flows.
- **Component tests** for critical frontend flows (dose logging, Circle invite flow) using React Testing Library.
- **Manual QA pass** against the checklist in §8 before any production promotion, since reminder reliability and permission correctness are trust-critical and warrant human verification beyond automated coverage.

## 7. Debugging Methodology

1. Reproduce locally against a dedicated Neon branch — never debug against production data.
2. Check structured logs first (request id, user id, route) before adding ad hoc `console.log` statements.
3. For AI-related issues, log the constructed prompt and raw Groq response (redacting PII in non-local environments) to separate "is this a prompt problem or an application logic problem."
4. For reminder/notification issues, verify the scheduling job ran and check delivery provider status before assuming application-level failure.

## 8. Definition of Done

A ticket is not "done" when the code merges — it is done when all of the following are true:

- [ ] Meets the acceptance criteria stated in `PRODUCT.md` for the relevant feature.
- [ ] Matches `DESIGN.md` tokens and motion rules — no ad hoc spacing, color, or animation.
- [ ] Passes the full Quality Assurance checklist below.
- [ ] Has automated test coverage per §6 appropriate to the change (service-layer logic always covered; pure UI polish may rely on component/manual tests only).
- [ ] Any new or changed permission-sensitive endpoint has an explicit RBAC test (`ARCHITECTURE.md` §13) proving unauthorized access is rejected.
- [ ] Any new AI-facing feature has been checked against the AI Ethics constraints in `PRODUCT.md` §10 (no diagnostic claims, labeled as AI-generated, scoped data only).
- [ ] Documentation (this set of five files) is updated if the change alters product scope, design tokens, architecture, or workflow — stale docs are treated as a bug.
- [ ] Reviewed and approved by at least one other engineer.

**Quality Assurance checklist (carried from production-readiness review):**
- [ ] All CI checks passing (lint, typecheck, tests).
- [ ] Manually verify medication reminder fires correctly across at least one real schedule.
- [ ] Manually verify Circle permission boundaries — a connected member cannot see data they haven't been granted.
- [ ] Verify AI digest and nudge content is clearly labeled as AI-generated.
- [ ] Accessibility spot-check: keyboard navigation and screen reader pass on any new/changed screen.
- [ ] Visual review against `DESIGN.md` tokens (spacing, color, type) — no ad hoc styling.
- [ ] Performance budgets in §9 below are not regressed.

## 9. Performance Budgets

These are enforced, not aspirational — a PR that regresses a budget below is blocked until addressed or explicitly accepted via documented exception in the PR description.

| Metric | Budget |
|---|---|
| Initial page load (time to interactive, typical connection) | < 2.0s, matching `PRODUCT.md` §7 |
| Route transition (in-app navigation) | < 300ms, matching the motion timing ceiling in `DESIGN.md` §8 |
| API response time (p95, standard CRUD endpoints) | < 500ms |
| AI digest/Q&A response (perceived latency to first content) | < 1.5s, leveraging Groq's low-latency inference |
| JS bundle size (initial load, gzipped) | < 250KB, enforced via route-level code splitting |
| Notification delivery (reminder fire to device receipt) | < 5s from scheduled time |

Budgets are revisited at each major phase boundary (see `PRODUCT.md` §12) as scope and infrastructure evolve.

## 10. Release Workflow

1. Merge to `main` → automatic staging deploy.
2. Run the Definition of Done QA checklist (§8) against staging.
3. Confirm Neon migration applied cleanly to the staging branch.
4. Confirm performance budgets (§9) are within range on staging.
5. Promote to production via Vercel.
6. Run a smoke test against production immediately after promotion (auth, dose logging, AI digest fetch, one RBAC-protected Circle view).
7. Monitor error rates and notification delivery success for the first hour post-deploy.
8. Tag the release (matching Conventional Commits-derived version) and update the changelog, including any API version notes per `ARCHITECTURE.md` §8.

## 11. Bug Fix Policy

Bugs are filed with: reproduction steps, expected vs. actual behavior, environment, and severity.

| Severity | Definition | Response |
|---|---|---|
| Critical | Reminder failures, auth failures, data leakage across Circle/RBAC permissions, AI surfacing unlabeled or diagnostic content | Fixed immediately, out of normal sprint cadence; hotfix released same day where possible |
| High | Feature broken for a meaningful subset of users, no data/privacy exposure | Addressed within the current sprint |
| Medium | Feature degraded but workaround exists | Triaged into the next sprint planning session |
| Low | Cosmetic, minor copy issues, non-blocking polish | Backlog, addressed opportunistically |

Any Critical-severity fix follows an abbreviated version of the Release Workflow (§10): it still requires the RBAC and reminder-reliability checks relevant to the fix, but does not wait for the next planned release cycle.

## 12. Sprint Planning Approach

- Two-week sprints.
- Each sprint pulls from a prioritized backlog tied directly to `PRODUCT.md` roadmap phases — no ad hoc feature work outside the documented MVP vs. Future Scope boundary (`PRODUCT.md` §12) without explicit product discussion.
- Each sprint reserves capacity for bug fixes and technical debt (target: ~20%).
- Per the Reliability principle in `PRODUCT.md` §3, reliability and Critical/High bug fixes take priority over new feature work when both compete for the same sprint capacity.

## 13. Contribution Guidelines

- Read all five Phase 0 documents before contributing (see `README.md` §9).
- New features must align with `PRODUCT.md` scope and follow `DESIGN.md` and `ARCHITECTURE.md` conventions — PRs introducing new visual patterns or architectural deviations should raise that explicitly in the PR description for discussion, not introduce it silently.
- Every PR description should state: what changed, why, and how it was tested, and should reference which Definition of Done items (§8) apply.
