# ARCHITECTURE

> Cross-references: `PRODUCT.md` for the requirements driving these decisions, `DESIGN.md` for the frontend's visual contract, `DEVELOPMENT.md` for the conventions and workflow that apply this architecture day to day.

## 1. System Overview

DoseLoop is a client-server web application: a React/Vite SPA frontend, an Express.js REST API backend, a Neon PostgreSQL database accessed via Prisma, Google OAuth for authentication, and a Groq-powered AI layer for the assistant features. The MVP is a monolith-friendly architecture — a single backend service — deliberately, so the team can move quickly without premature microservice complexity, while keeping clean internal boundaries (`services/`) so it can be decomposed later if scale demands it.

## 2. Frontend Architecture

- **React + Vite + TypeScript** for fast builds and type safety across the codebase.
- **Feature-based folder structure** (`features/medications`, `features/wellness`, `features/circle`, `features/ai`) rather than type-based (`components/`, `containers/`) at the top level, so related logic, components, and hooks live together.
- **State management:** Server state via React Query (cache, refetch, optimistic updates for dose logging); lightweight client/UI state (modals, form drafts) via Zustand. Avoid a heavyweight global store — most state in DoseLoop is server state.
- **Routing:** File-based or declarative route config at the `pages/` level, with route-level code splitting so the initial bundle stays small.
- **Component layer:** shadcn/ui primitives customized per `DESIGN.md` tokens, composed into feature components. Shared, brand-specific components (e.g., `DoseCard`, `CircleStatusBadge`) live in `components/`. Motion implementation follows the rules in `DESIGN.md` §8.

## 3. Backend Architecture

- **Express.js** REST API, organized as `routes → controllers → services → Prisma`.
- **Routes** define endpoints and attach middleware (auth, validation, RBAC — see §13).
- **Controllers** handle request/response shape only — no business logic.
- **Services** contain business logic (e.g., `medicationService.calculateAdherence()`) and are the only layer that talks to Prisma directly, keeping data access centralized and testable.
- **Middleware:** authentication (session/JWT verification from Google OAuth), authorization (RBAC, §13), request validation (e.g., Zod schemas shared with the frontend via the `packages/shared` types), centralized error handling, and rate limiting on AI and auth endpoints.

## 4. Database Strategy

- **Neon PostgreSQL** as the primary data store, chosen for serverless scaling and branch-per-environment workflows (a dedicated Neon branch per PR/preview deploy avoids ever testing against production data).
- **Core entities:** `User`, `Medication`, `DoseLog`, `WellnessEntry`, `Circle`, `CircleMembership`, `SharingPermission`, `AIInsight`.
- **Relationships:** A `User` has many `Medication` and `WellnessEntry` records. A `Circle` connects an Owner `User` to one or more Connected Member `User`s via `CircleMembership`, with `SharingPermission` rows defining exactly which data types are visible to which member — sharing is additive and explicit, never default-on.
- **Auditability:** `DoseLog` entries are append-only (status changes create new log entries rather than mutating history) to preserve an accurate adherence record.

## 5. Prisma Design Philosophy

- Schema is the single source of truth for data shape; types are generated, never hand-duplicated.
- Favor explicit, narrow models over generic polymorphic ones (e.g., separate `WellnessEntry` types via an enum + JSON metadata column rather than a separate table per habit type, to stay extensible without schema churn).
- All migrations are reviewed and run through Prisma Migrate, never applied manually against Neon.
- Soft deletes (`deletedAt` timestamp) for user-facing records like medications, so accidental deletion is recoverable; hard deletes reserved for genuine account-deletion/privacy-request flows.

## 6. Neon PostgreSQL Integration

- Each environment (local dev, preview, staging, production) maps to a distinct Neon branch, enabling safe schema experimentation without risk to production data.
- Connection pooling via Neon's pooled connection string for the serverless-friendly access pattern, given Express running on Vercel.

## 7. Authentication Flow

- Google OAuth 2.0 is the sole MVP authentication method, chosen to avoid the security overhead of password storage/reset flows in a healthcare-adjacent product.
- Flow: client initiates Google sign-in → Google returns an ID token → backend verifies the token against Google's public keys → backend issues its own short-lived session token (httpOnly, secure cookie) → subsequent requests are authenticated via that session cookie, not the raw Google token.
- Circle invitations use a separate, single-use, expiring token system (not tied to auth) so an invite link can be safely shared without granting account access.
- Authentication answers "who are you"; authorization (RBAC, §13) answers "what can you see and do" — the two are deliberately separate layers so permission logic stays centralized and auditable.

## 8. API Structure and Versioning

RESTful resource-oriented endpoints, versioned under `/api/v1`:

```
POST   /api/v1/auth/google
GET    /api/v1/me

GET    /api/v1/medications
POST   /api/v1/medications
PATCH  /api/v1/medications/:id
DELETE /api/v1/medications/:id
POST   /api/v1/medications/:id/log

GET    /api/v1/wellness
POST   /api/v1/wellness

GET    /api/v1/circle
POST   /api/v1/circle/invite
POST   /api/v1/circle/invite/accept
PATCH  /api/v1/circle/permissions

GET    /api/v1/ai/digest
POST   /api/v1/ai/ask
```

All endpoints return a consistent envelope (`{ data, error }`) and use standard HTTP status codes; validation errors return structured field-level messages consumable directly by frontend forms.

**Versioning policy:**
- The API is versioned at the URL path level (`/api/v1`, `/api/v2`...). A new major version is introduced only for breaking changes (removed fields, changed semantics, changed auth model) — additive, backward-compatible changes (new optional fields, new endpoints) ship within the current version.
- A version is not deprecated until all active first-party clients (the DoseLoop web app) have migrated, plus a minimum deprecation window communicated in the changelog before the old version is removed.
- Mobile clients (Phase 3, per `PRODUCT.md` §12) make versioning discipline non-negotiable, since native apps cannot be force-updated as easily as a web SPA.

## 9. Groq AI Integration

- A dedicated `server/src/ai/` module wraps all Groq API calls, so prompt construction, model selection, and response parsing are centralized and not duplicated across routes.
- **Daily digest generation:** a scheduled job (e.g., via a cron-triggered serverless function) compiles a user's prior-day data into a structured prompt and stores the generated summary as an `AIInsight` record, rather than calling Groq on every page load.
- **Proactive nudges:** triggered by service-layer business rules (e.g., "two consecutive missed doses of a critical medication," matching the Notification Escalation Matrix in `PRODUCT.md` §9), not by the AI deciding independently when to speak — the AI generates the message; the application logic decides when a nudge is warranted, per the AI Ethics constraints in `PRODUCT.md` §10.
- **Conversational Q&A:** scoped by including only the requesting user's own data (and any Circle data they're permitted to see, enforced via RBAC §13) in the prompt context, with an explicit system prompt constraining the assistant to wellness/medication-adherence topics and away from diagnostic or prescriptive medical claims.
- All AI-generated content affecting a user's data view should be clearly labeled as AI-generated within the UI per `DESIGN.md` §9.
- **Notification delivery and budgeting:** a single internal notification service enforces the per-user daily notification cap described in `PRODUCT.md` §9, regardless of which subsystem (reminders, AI nudges, digests) originates the message — this prevents any one feature from silently exceeding the user's notification budget.

## 10. Folder Structure

See `README.md` §6 for the full repository layout. Key principle: frontend `features/`, backend `services/`, and `packages/shared` types are named and scoped identically (e.g., `medications` everywhere) so any engineer can trace a feature across the stack without translation.

## 11. State Management

- **Server state (frontend):** React Query — cache invalidation tied to mutations (e.g., logging a dose invalidates the relevant medication and adherence queries).
- **Client/UI state:** Zustand for ephemeral state like active modal, draft forms, and onboarding progress.
- **Backend:** stateless request handling; no server-side session state beyond the auth cookie — all durable state lives in Neon.

## 12. Security Architecture

- All traffic over HTTPS; Vercel handles TLS termination.
- Data encrypted at rest (Neon default) and in transit.
- Principle of least exposure: API responses are shaped per-endpoint to return only the fields the requesting user is authorized to see — Circle data is filtered server-side based on `SharingPermission`, never filtered client-side only.
- Secrets (Groq API key, database URL, OAuth credentials) stored as environment variables / Vercel secrets, never committed.
- Rate limiting on authentication and AI endpoints to prevent abuse.
- Input validation on every mutating endpoint via shared Zod schemas.
- Authorization is enforced at the service layer (§13, RBAC), not just hidden in the UI — every mutating and data-returning endpoint checks permission server-side regardless of what the frontend would otherwise show.
- Security review (see `DEVELOPMENT.md` §8, Definition of Done) is a required gate before any change touching auth, sharing permissions, or data export ships.

## 13. RBAC (Role-Based Access Control)

DoseLoop's permission model has two layers, matching the product roles defined in `PRODUCT.md` §8:

**Roles:**
- **Owner** — the user whose health data a record belongs to. Full read/write access to their own data by default.
- **Connected Member** — a Circle participant granted visibility into an Owner's data per `SharingPermission`. Read-only by default; write access (e.g., logging a dose on someone's behalf) is a distinct, separately granted permission, not implied by read access.
- **System/Service** — internal backend processes (scheduled jobs, the AI digest generator) that operate with their own narrowly scoped service credentials, never a user's session token.

**Enforcement model:**
- Every API request resolves to a `(requester, resource, action)` tuple, checked against the resource owner's `SharingPermission` records before the service layer executes any read or write.
- Permission checks happen once, centrally, in middleware/service-layer guards — not duplicated ad hoc in individual route handlers, to avoid the class of bug where one endpoint forgets to check permissions.
- Permission grants are scoped per data type (medications, wellness) and per Connected Member — there is no "view everything" role short of the Owner themselves.
- Revocation is immediate: removing a `SharingPermission` takes effect on the next request, with no caching of stale permission state beyond the request lifecycle.
- All permission changes are logged (who granted/revoked what, and when) to support the trust and auditability goals in `PRODUCT.md` §3.

## 14. Deployment Strategy

- **Hosting:** Vercel for both frontend (static + edge) and backend (serverless functions for the Express API, or a Vercel-compatible adapter).
- **Environments:** local → PR preview (own Neon branch) → staging → production, with manual promotion from staging to production.
- **CI:** GitHub Actions running lint, typecheck, and test suites on every PR before merge is allowed.
- Full release workflow and promotion checklist are defined in `DEVELOPMENT.md` §10.

## 15. Scalability Considerations

- The service-layer boundary in the backend allows specific domains (e.g., AI processing, notification delivery) to be extracted into separate services later without a frontend-facing API change.
- Neon's serverless scaling handles read/write growth without manual provisioning in the MVP stage.
- Notification delivery (push/SMS/email) is designed behind a single internal interface from day one, so adding providers later (Phase 2 SMS fallback, per `PRODUCT.md` §12) doesn't require touching call sites throughout the codebase.

## 16. Development Conventions

Coding standards, naming conventions, and workflow detail live in `DEVELOPMENT.md`; this document defines structure and rationale, that document defines day-to-day practice.
