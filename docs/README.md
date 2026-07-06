# README

## 1. Product Vision

DoseLoop is an AI-powered Family Health Companion. It exists so that people never have to wonder, in the back of their mind, whether the people they love are okay — whether a parent took their blood pressure medication, whether a child drank enough water today, whether grandma is reachable if something goes wrong. DoseLoop turns scattered, anxious check-ins into quiet, automatic confidence.

## 2. Mission

To give individuals and families a single, trustworthy system for managing medication, wellness habits, and emergency connectivity — built with the calm, premium feel of software people actually enjoy using every day.

## 3. Philosophy

- **Peace of mind over feature count.** Every feature must reduce worry, not add noise.
- **Calm by design.** Healthcare software is too often clinical, cluttered, or alarmist. DoseLoop is quiet, legible, and reassuring.
- **AI as a caregiver's assistant, not a chatbot.** AI in DoseLoop proactively notices, reminds, and explains — it does not exist to be talked to for its own sake.
- **Family as the unit of design.** Most health apps are built for a single user. DoseLoop is built around relationships: caregiver ↔ parent, partner ↔ partner, student ↔ family back home.
- **Trust is the product.** Every design and engineering decision is filtered through: "would this make a user trust us more or less with their family's health data?"

## 4. Goals (Phase 0 → MVP)

1. Let any user track medications with accurate, dependable reminders.
2. Let users build and maintain simple wellness habits (hydration, sleep, steps, mood).
3. Let family members connect as a "Circle" and see relevant, consented health activity.
4. Provide an AI assistant that proactively surfaces insights ("Dad missed his evening dose two days in a row") rather than waiting to be asked.
5. Ship a product that feels premium — comparable in polish to Apple Health, Linear, or Notion — not like a generic AI-generated CRUD app.

## 5. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | React + Vite + TypeScript | Fast dev loop, strong typing, large ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Utility-first speed with accessible, composable primitives |
| Motion | Framer Motion | Physically believable, restrained animation |
| Backend | Express.js | Simple, well-understood, easy to scale into services later |
| ORM | Prisma | Type-safe queries, clean migrations |
| Database | Neon PostgreSQL | Serverless Postgres, branching for safe migrations |
| Auth | Google Authentication | Low-friction sign-in trusted by users |
| AI | Groq API | Low-latency inference for real-time assistant responses |
| Hosting | Vercel | Zero-config deploys, preview environments |
| Source control | GitHub | Standard collaborative workflow |

Full rationale for each choice is documented in `ARCHITECTURE.md`.

## 6. Repository Structure

```
doseloop/
├── apps/
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── components/  # Shared UI components (shadcn-based)
│       │   ├── features/    # Feature-scoped modules (medications, wellness, circle, ai)
│       │   ├── pages/        # Route-level views
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── stores/       # Client state (e.g. Zustand)
│       │   └── styles/
│       └── public/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── ai/                # Groq integration layer
│   │   └── lib/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── packages/
│   └── shared/                # Shared types/constants between client and server
├── docs/
│   ├── README.md
│   ├── PRODUCT.md
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   └── DEVELOPMENT.md
└── .github/
    └── workflows/
```

## 7. Development Workflow (Summary)

1. Branch from `main` using the naming convention defined in `DEVELOPMENT.md`.
2. Build and test locally against a Neon branch database (never against production data).
3. Open a PR; CI runs lint, typecheck, and tests.
4. At least one review required before merge.
5. Merges to `main` auto-deploy a preview via Vercel; `main` itself maps to staging, with a manual promotion step to production.

Full detail in `DEVELOPMENT.md`.

## 8. Project Roadmap

**Phase 0 — Foundation (current):** Documentation, design system, architecture decisions.

**Phase 1 — MVP:**
- Auth (Google)
- Medication tracking + reminders
- Basic wellness logging (water, sleep, mood)
- Family Circle (invite, view shared status)
- AI assistant v1 (Groq-powered): daily summaries, missed-dose nudges, basic Q&A

**Phase 2 — Growth:**
- Emergency SOS / location-aware alerts
- Smart scheduling (refill predictions, doctor visit reminders)
- Caregiver dashboards for multiple dependents
- Push notification and SMS fallback channels

**Phase 3 — Platform:**
- Wearable integrations
- Pharmacy/EHR integrations
- Native mobile apps
- Multi-language support

Full detail, including success metrics per phase, is in `PRODUCT.md`.

## 9. Onboarding for New Developers

1. Read all five Phase 0 documents in order: README → PRODUCT → DESIGN → ARCHITECTURE → DEVELOPMENT.
2. Request access to the shared Neon project and Vercel team.
3. Clone the repo, copy `.env.example` to `.env`, and follow setup steps in `DEVELOPMENT.md`.
4. Run the app locally and complete the onboarding checklist issue template before picking up your first ticket.
5. All UI work must follow `DESIGN.md`; all data/API work must follow `ARCHITECTURE.md`. These are not optional style guides — they are the contract that keeps the product coherent.

## 10. Document Index

- `PRODUCT.md` — what we are building and why, including Product Principles, Notification Philosophy, AI Ethics, and the MVP vs. Future Scope boundary.
- `DESIGN.md` — DoseLoop's Design Bible: how it should look, feel, and behave, including the Motion Language and Accessibility Standards.
- `ARCHITECTURE.md` — how it is technically built, including Security Architecture, RBAC, and API versioning policy.
- `DEVELOPMENT.md` — how we work day to day, including the Definition of Done, Performance Budgets, Release Workflow, and Bug Fix Policy.

These four documents are designed to be read together, not in isolation. Each cross-references the others directly (e.g., a notification rule defined in `PRODUCT.md` points to its visual treatment in `DESIGN.md` and its delivery mechanics in `ARCHITECTURE.md`); if you find a contradiction between documents, treat it as a documentation bug and raise it rather than picking whichever version is convenient.
