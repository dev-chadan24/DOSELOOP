# PRODUCT

> Cross-references: see `README.md` for product vision and roadmap context, `DESIGN.md` for how these requirements are expressed visually, `ARCHITECTURE.md` for how they are technically implemented, and `DEVELOPMENT.md` for the Definition of Done that governs when a feature here is considered shippable.

## 1. Problem Statement

Families managing health today rely on a patchwork of disconnected tools: pill organizers, phone alarms, sticky notes, group chat check-ins, and pure memory. This works poorly for three groups in particular:

- **Adult children with aging parents**, who worry constantly about missed medications or undetected emergencies but have no real-time visibility.
- **People managing chronic conditions**, who need consistent medication and habit adherence but lack a system that adapts to their routine.
- **Households juggling multiple family members' health needs** (kids' medications, a partner's wellness goals, an elderly parent's prescriptions), who currently track everything in their head or across multiple apps.

The result is preventable missed doses, late-discovered emergencies, and a constant low-grade anxiety that existing medicine-reminder apps — which are typically single-user, single-purpose, and visually clinical — do not solve.

## 2. Market Opportunity

Medication reminder apps are a mature but fragmented category, mostly built around a single user logging their own doses. Family-coordination health apps are far less developed, and the few that exist tend to look and feel like enterprise medical software rather than something a family would enjoy using daily. DoseLoop's opportunity is the intersection of three underserved needs: family-level (not individual-level) health coordination, proactive AI assistance rather than passive logging, and premium consumer-grade design comparable to top productivity apps. This combination is currently not well served by incumbents.

## 3. Product Principles

These principles govern every product decision, from MVP scope cuts to Phase 3 roadmap calls. When a feature request conflicts with one of these, the principle wins.

1. **Peace of mind is the product, not a tagline.** Every feature is evaluated by whether it measurably reduces worry for the user or their Circle — not by novelty or technical interest.
2. **Consent is non-negotiable.** No health data crosses from one person to another without explicit, granular, revocable permission. This principle is enforced at the architecture level (see `ARCHITECTURE.md` §13, RBAC) as well as the product level.
3. **Proactive, not noisy.** The AI assistant and notification system exist to surface what matters, not to maximize engagement. A nudge that doesn't change a user's behavior or understanding has failed, regardless of open rate.
4. **Calm over clever.** Where a simple, boring solution and a clever, novel one both solve the problem, prefer the simple one. Complexity is a cost paid by every future maintainer and every user's cognitive load.
5. **Independence first, oversight second.** DoseLoop is built primarily for the person managing their own health (Marcus, Grace), not for surveillance of them. Circle visibility is a layer the primary user opts into, never a default.
6. **Reliability is the trust mechanism.** A missed reminder due to a bug is a more serious failure than a missing feature. Reliability work takes priority over new feature work when the two compete for the same sprint capacity (see `DEVELOPMENT.md` §12).

## 4. User Personas

**1. Aisha, 34 — The Long-Distance Caregiver**
Lives in another city from her parents. Calls every evening partly to ask "did you take your medicine?" Wants quiet confidence without nagging or surveillance.

**2. Marcus, 61 — The Self-Managing Patient**
Manages hypertension and diabetes with multiple daily medications. Wants reliable reminders, simple logging, and to optionally share status with his daughter without giving up control.

**3. Priya, 29 — The Busy Parent**
Tracks two kids' medications, her own prenatal vitamins, and tries to keep the household hydrated and sleeping well. Needs one shared system instead of three different apps.

**4. Daniel, 22 — The Student Living Away From Home**
Newly independent, inconsistent routines. His family wants light visibility (not control) to reassure them he's okay, especially around mental health and basic self-care.

**5. Grace, 71 — The Elderly Primary User**
Uses the app herself, not just as someone being monitored. Needs large, legible UI, minimal friction, and a system that respects her independence while keeping her daughter informed if she chooses.

## 5. User Journeys

**Medication adherence (Marcus):** Marcus adds a medication once, with dosage, frequency, and timing. DoseLoop reminds him at the right time, lets him log "taken / skipped / snoozed" in one tap, and quietly tracks adherence trends. If he misses two doses in a row, the AI assistant surfaces a gentle nudge — to him, and optionally to a designated family member.

**Family peace of mind (Aisha):** Aisha is invited into her father's Circle. She sees a simple status view — not raw data, but a synthesized state: "Dad's on track today" or "Dad missed his morning dose — want to check in?" She is never shown more detail than her father has consented to share.

**Daily wellness habit (Priya):** Priya logs water intake and sleep for herself and sets simple wellness goals for her kids (e.g., bedtime reminders). The AI assistant gives her a single daily summary instead of three separate app notifications.

**Emergency awareness (Grace's family):** If Grace doesn't check in or log expected activity for an unusual stretch of time, her Circle is notified with context, not alarm — encouraging a check-in rather than triggering panic.

## 6. Functional Requirements (MVP Scope)

- User authentication via Google.
- Create, edit, delete medications with dosage, frequency, custom schedule, and notes.
- Reminder notifications for medications at scheduled times.
- One-tap dose logging: taken, skipped, snoozed.
- Adherence history view (daily/weekly).
- Wellness logging: water intake, sleep, mood, and an extensible habit type.
- Family Circle: invite members, accept/decline, set per-member sharing permissions.
- Circle dashboard: simplified, synthesized status per connected member (not raw logs, unless explicitly granted).
- AI assistant: daily summary generation, missed-dose nudges, natural-language Q&A about a user's own data ("how did I do this week?").
- Notification preferences (push, in-app; SMS/email as fallback in later phase).
- Account and privacy settings, including the ability to leave a Circle or revoke sharing at any time.

## 7. Non-Functional Requirements

- **Reliability:** Medication reminders must fire correctly; this is the core trust mechanism of the product and cannot be flaky.
- **Privacy by default:** No health data is visible to a Circle member unless explicitly and granularly consented to by the data owner.
- **Performance:** Initial page load under 2 seconds on a typical connection; AI responses should feel near-instant given Groq's low-latency inference. See `DEVELOPMENT.md` §9 (Performance Budgets) for enforced numeric targets.
- **Accessibility:** WCAG 2.1 AA minimum, with particular attention to elderly users (large tap targets, legible type, no reliance on color alone). Full standard defined in `DESIGN.md` §9.
- **Security:** All health data encrypted at rest and in transit; authentication via Google OAuth only in MVP to avoid password-management risk. Full model in `ARCHITECTURE.md` §12.
- **Scalability:** Architecture must support growth from single users to multi-dependent caregiver accounts without redesign.

## 8. Feature Specifications (MVP)

**Medication Management**
- Fields: name, dosage, form, frequency/schedule, start date, optional end date, notes, optional photo of the pill/package.
- Supports multiple times per day and irregular schedules (e.g., every other day).

**Reminders**
- Time-based push notifications.
- Snooze with configurable default duration.
- Escalation: if a dose marked critical is missed and not logged within a window, optionally notify a designated Circle member.

**Wellness Tracking**
- Quick-log widgets for water, sleep, and mood.
- Daily and weekly trend views.

**Family Circle**
- Invite via email/link.
- Roles: Owner (the person whose health is tracked) and Connected Member (caregiver/viewer).
- Granular sharing: per data type (medications, wellness, both), per connected member.
- Role and permission enforcement is implemented as RBAC at the API layer — see `ARCHITECTURE.md` §13.

**AI Assistant**
- Daily digest: a short, plain-language summary of the user's day relative to their goals.
- Proactive nudges: triggered by missed doses or unusual inactivity, not arbitrary intervals.
- Conversational Q&A scoped to the user's own data and general medication/wellness information — never diagnostic or prescriptive medical advice.
- Governed by the AI Ethics principles in §10 below.

## 9. Notification Philosophy

Notifications are the most trust-sensitive surface in DoseLoop: too few and a dose is missed; too many and the user disables notifications entirely, defeating the product's purpose. DoseLoop follows three rules:

1. **Every notification must be actionable or reassuring — never ambient noise.** A reminder asks for a one-tap response; a digest tells the user something is fine so they don't have to check.
2. **Escalation is earned, not default.** A single missed dose is logged silently. A pattern of missed doses (per the Notification Escalation Matrix below) is what triggers a nudge to the user, and only a sustained or critical pattern escalates to a Circle member — and only if permitted.
3. **Frequency caps are enforced per user, not per feature.** Medication reminders, wellness nudges, and AI digests share a single daily notification budget so a user is never reminded about multiple things in close succession; see budget enforcement in `ARCHITECTURE.md` §9.

**Notification Escalation Matrix (MVP)**

| Trigger | Recipient | Channel | Tone |
|---|---|---|---|
| Scheduled dose due | Owner | Push | Neutral reminder |
| Dose missed once | Owner only | In-app | Gentle, non-judgmental |
| Dose missed 2x consecutively (critical medication) | Owner + permitted Circle member | Push | Concerned, factual, no alarm language |
| Unusual inactivity (no logs for an extended window) | Owner first, then permitted Circle member if unresolved | Push | Check-in framing, never "emergency" language unless user-confirmed |
| Daily digest | Owner (and Circle members per their permission scope) | In-app / push (user preference) | Calm summary |

Notification visual and interaction treatment is defined in `DESIGN.md` §11; delivery infrastructure is defined in `ARCHITECTURE.md` §9.

## 10. AI Ethics

DoseLoop's AI assistant operates under explicit ethical constraints, since it touches health information and family relationships:

- **No diagnosis, no prescription.** The assistant never interprets symptoms, suggests medications, or alters dosage guidance. It reports adherence and habit data and answers logistical questions only; any health-interpretation question is redirected to "talk to your doctor or pharmacist."
- **Transparency.** All AI-generated content (digests, nudges, answers) is visibly labeled as AI-generated in the UI, per `DESIGN.md` §9. Users can always see the underlying data behind a summary.
- **Data minimization in prompts.** Only the data required to answer the specific request or generate the specific digest is included in any Groq API call — never a user's full history by default. Detailed in `ARCHITECTURE.md` §9.
- **No autonomous escalation.** The AI never decides on its own to contact a Circle member or emergency contact; it can only draft a message that the application's rule-based escalation logic (§9 above) decides to send. This keeps escalation auditable and predictable rather than an opaque model decision.
- **Bias and tone review.** AI-generated language is reviewed against the calm, non-judgmental tone defined in `DESIGN.md` before shipping any new prompt template — a nudge that reads as guilt-inducing or alarmist is a defect, not a style preference.
- **User control.** Users can disable proactive AI nudges entirely while keeping core medication reminders, since the two are independent systems (rule-based reminders never depend on the AI layer being enabled).

## 11. MVP Definition

The MVP is complete when a single user can: sign in, add a medication, receive and act on a reminder, log a wellness habit, invite one family member into their Circle with defined sharing permissions, and receive at least one proactive AI-generated insight — all within a premium, cohesive interface matching `DESIGN.md`, and meeting the Definition of Done in `DEVELOPMENT.md` §8.

## 12. MVP vs. Future Scope

| Capability | MVP (Phase 1) | Future (Phase 2/3) |
|---|---|---|
| Medication reminders | Push, in-app | + SMS/email fallback (Phase 2) |
| Sharing model | Manual per-member permissions | Same model, extended to multi-dependent caregiver dashboards (Phase 2) |
| Emergency handling | Inactivity-based Circle nudge | Location-aware SOS (Phase 2) |
| Refills | Manual tracking only | Predictive refill + pharmacy integration (Phase 2) |
| AI assistant | Digest, nudges, scoped Q&A | Expanded coaching, care-team collaboration (Phase 3) |
| Platforms | Responsive web (mobile-first) | Native iOS/Android (Phase 3) |
| Data integrations | None | Wearables, EHR/pharmacy systems (Phase 3) |
| Language support | English only | Multi-language (Phase 3) |

This table is the authoritative scope boundary for engineering estimation; if a ticket implies Phase 2/3 capability, it is out of MVP scope by definition and should be flagged in planning rather than quietly absorbed into a Phase 1 ticket.

## 13. Future Roadmap

**Phase 2:** Emergency SOS with location sharing, refill prediction and pharmacy reminders, multi-dependent caregiver dashboards (e.g., managing both parents and kids from one account), SMS/email notification fallback.

**Phase 3:** Wearable integration (heart rate, sleep tracking sync), EHR/pharmacy data integration, native iOS/Android apps, multi-language support, care-team collaboration (for professional caregivers).

## 14. Success Metrics

- **Adherence rate:** % of scheduled doses logged as taken, tracked per user and in aggregate.
- **Circle activation:** % of users who successfully connect at least one family member.
- **Retention:** Week-4 and week-12 retention of active loggers.
- **AI engagement quality:** % of proactive nudges that lead to a logged action within the same day (signal that nudges are useful, not noisy).
- **Trust signal:** Self-reported reduction in "worry frequency" via in-app survey, measured at 30 and 90 days.
- **Notification health:** Opt-out rate of push notifications; a rising opt-out rate is treated as a Notification Philosophy violation (§9) requiring product review, not just a growth metric to optimize around.

## 15. Business Objectives

- Establish DoseLoop as the default family-level (not just individual-level) health coordination app.
- Build a defensible data and trust moat through consistent reliability and privacy-respecting design — the opposite of a growth-hacked, notification-spammy product.
- Validate willingness to pay via a future premium tier (e.g., multi-dependent management, SMS fallback, advanced AI insights) without gating core safety features like medication reminders.

## 16. Product Strategy Summary

DoseLoop wins not by having the most features, but by being the most trusted. Every roadmap decision is evaluated against: does this increase a family's confidence in each other's wellbeing, or does it just add complexity? Features that look impressive but increase anxiety, clutter, or notification fatigue are explicitly out of scope, regardless of technical feasibility.
