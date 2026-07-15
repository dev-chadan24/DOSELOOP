-- =============================================================================
-- DoseLoop — Row Level Security (RLS) Apply Script
-- =============================================================================
-- Project      : DoseLoop Healthcare App
-- Database     : Supabase PostgreSQL
-- Auth model   : Backend-Mediated (Express + Prisma service_role bypasses RLS)
-- Scope        : public schema, 15 tables
-- Generated    : 2026-07-15
--
-- SAFETY GUARANTEE:
--   All Prisma queries run via the service_role key which bypasses RLS
--   completely. This script ONLY affects direct PostgREST / Realtime /
--   Dashboard access using the `authenticated` or `anon` roles.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste entire file → Run
--   OR: psql "$DIRECT_URL" -f rls_apply.sql
--
-- ORDER: Dependencies first (User before Medication, Medication before
--        MedicationSchedule / DoseEvent, AssistantConversation before
--        AssistantMessage).
-- =============================================================================


-- =============================================================================
-- TABLE 0: _prisma_migrations
-- =============================================================================
-- Strategy: Enable RLS + zero policies = implicit DENY ALL for every non-
--           service role. Prisma (service_role) bypasses RLS and keeps working.
-- =============================================================================

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- No policies intentionally. Silence = deny for authenticated / anon.


-- =============================================================================
-- TABLE 1: User
-- =============================================================================
-- Strategy: Owner-only. `id` IS the Supabase Auth UID (set at upsert time in
--           auth.service.ts). Users can SELECT and UPDATE only their own row.
--           INSERT/DELETE are service-role-only (sync + account deletion).
-- =============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own"
  ON "User"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "user_update_own"
  ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- INSERT : handled exclusively by service_role (auth sync endpoint)
-- DELETE : handled exclusively by service_role (account deletion endpoint)


-- =============================================================================
-- TABLE 2: Medication
-- =============================================================================
-- Strategy: Owner-only via direct `userId` column. Full CRUD permitted because
--           the Express API validates ownership before every write, but we layer
--           the same check at the DB level for defense-in-depth.
-- =============================================================================

ALTER TABLE "Medication" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medication_select_own"
  ON "Medication"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "medication_insert_own"
  ON "Medication"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "medication_update_own"
  ON "Medication"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "medication_delete_own"
  ON "Medication"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 3: MedicationSchedule
-- =============================================================================
-- Strategy: No direct userId. Ownership resolved via EXISTS join to Medication.
--           The subquery is indexed (Medication.id PK + Medication.userId idx).
-- =============================================================================

ALTER TABLE "MedicationSchedule" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medschedule_select_own"
  ON "MedicationSchedule"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "medschedule_insert_own"
  ON "MedicationSchedule"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "medschedule_update_own"
  ON "MedicationSchedule"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "medschedule_delete_own"
  ON "MedicationSchedule"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );


-- =============================================================================
-- TABLE 4: DoseEvent
-- =============================================================================
-- Strategy: No direct userId. Ownership resolved via EXISTS join to Medication.
--           This is the most clinically sensitive table (adherence records = PHI).
-- =============================================================================

ALTER TABLE "DoseEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doseevent_select_own"
  ON "DoseEvent"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "doseevent_insert_own"
  ON "DoseEvent"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "doseevent_update_own"
  ON "DoseEvent"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "doseevent_delete_own"
  ON "DoseEvent"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "Medication" m
      WHERE  m.id = "medicationId"
        AND  m."userId" = auth.uid()::text
    )
  );


-- =============================================================================
-- TABLE 5: WellnessMetric
-- =============================================================================
-- Strategy: Owner-only via direct `userId`. Full CRUD — users log and manage
--           their own biometric/mood data.
-- =============================================================================

ALTER TABLE "WellnessMetric" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wellnessmetric_select_own"
  ON "WellnessMetric"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "wellnessmetric_insert_own"
  ON "WellnessMetric"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "wellnessmetric_update_own"
  ON "WellnessMetric"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "wellnessmetric_delete_own"
  ON "WellnessMetric"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 6: WaterLog
-- =============================================================================
-- Strategy: Owner-only via direct `userId`. Full CRUD — users log and manage
--           their own hydration data.
-- =============================================================================

ALTER TABLE "WaterLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waterlog_select_own"
  ON "WaterLog"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "waterlog_insert_own"
  ON "WaterLog"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "waterlog_update_own"
  ON "WaterLog"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "waterlog_delete_own"
  ON "WaterLog"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 7: FamilyMember
-- =============================================================================
-- Strategy: Owner-only via direct `userId`. Full CRUD — users manage their
--           own family circle. The `sharesMedication` / `sharesWellness` flags
--           are also locked to the owner.
-- =============================================================================

ALTER TABLE "FamilyMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "familymember_select_own"
  ON "FamilyMember"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "familymember_insert_own"
  ON "FamilyMember"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "familymember_update_own"
  ON "FamilyMember"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "familymember_delete_own"
  ON "FamilyMember"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 8: EmergencyContact
-- =============================================================================
-- Strategy: Owner-only via direct `userId`. Stores third-party PII (names,
--           phones, emails). Full CRUD for the owner only.
-- =============================================================================

ALTER TABLE "EmergencyContact" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergencycontact_select_own"
  ON "EmergencyContact"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "emergencycontact_insert_own"
  ON "EmergencyContact"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "emergencycontact_update_own"
  ON "EmergencyContact"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "emergencycontact_delete_own"
  ON "EmergencyContact"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 9: Notification
-- =============================================================================
-- Strategy: Owner-only SELECT + UPDATE (mark as read). No INSERT or DELETE for
--           authenticated role — all writes originate from service_role
--           (reminder engine, SOS handler, system events in notifications.service.ts).
-- =============================================================================

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_select_own"
  ON "Notification"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

-- Users may only flip `isRead`; the USING + WITH CHECK on userId prevents
-- cross-user updates. Column-level restriction is enforced in the API layer.
CREATE POLICY "notification_update_own"
  ON "Notification"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- INSERT : service_role only (reminder.engine.ts, emergency.service.ts)
-- DELETE : service_role only


-- =============================================================================
-- TABLE 10: AssistantConversation
-- =============================================================================
-- Strategy: Owner-only via direct `userId`. Full CRUD — users own their AI
--           conversation sessions. Medical dialogue history is PHI.
-- =============================================================================

ALTER TABLE "AssistantConversation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistantconv_select_own"
  ON "AssistantConversation"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "assistantconv_insert_own"
  ON "AssistantConversation"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "assistantconv_update_own"
  ON "AssistantConversation"
  FOR UPDATE
  TO authenticated
  USING  (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "assistantconv_delete_own"
  ON "AssistantConversation"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");


-- =============================================================================
-- TABLE 11: AssistantMessage
-- =============================================================================
-- Strategy: No direct userId. Ownership resolved via EXISTS join to
--           AssistantConversation. No UPDATE policy (messages are immutable
--           once stored). DELETE cascades from conversation.
-- =============================================================================

ALTER TABLE "AssistantMessage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistantmsg_select_own"
  ON "AssistantMessage"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "AssistantConversation" ac
      WHERE  ac.id = "conversationId"
        AND  ac."userId" = auth.uid()::text
    )
  );

CREATE POLICY "assistantmsg_insert_own"
  ON "AssistantMessage"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   "AssistantConversation" ac
      WHERE  ac.id = "conversationId"
        AND  ac."userId" = auth.uid()::text
    )
  );

-- No UPDATE policy: chat messages are immutable (append-only log).

CREATE POLICY "assistantmsg_delete_own"
  ON "AssistantMessage"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   "AssistantConversation" ac
      WHERE  ac.id = "conversationId"
        AND  ac."userId" = auth.uid()::text
    )
  );


-- =============================================================================
-- TABLE 12: AuditLog
-- =============================================================================
-- Strategy: SELECT-only for authenticated users (own rows only). ZERO write
--           policies for authenticated role — ALL writes go through service_role
--           (audit.service.ts logAuditEvent). This prevents log tampering.
--           System events have userId = NULL and are invisible to all users.
-- =============================================================================

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditlog_select_own"
  ON "AuditLog"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

-- INSERT : service_role only (audit.service.ts)
-- UPDATE : NEVER — audit logs must be immutable
-- DELETE : NEVER — audit logs must be immutable


-- =============================================================================
-- TABLE 13: Feedback
-- =============================================================================
-- Strategy: Owner can SELECT (view own submissions) and INSERT (submit).
--           No UPDATE or DELETE — feedback is immutable after submission.
--           Admin review happens exclusively via service_role tooling.
-- =============================================================================

ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select_own"
  ON "Feedback"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "feedback_insert_own"
  ON "Feedback"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

-- UPDATE / DELETE : service_role only (admin tooling)


-- =============================================================================
-- TABLE 14: EmergencyEvent
-- =============================================================================
-- Strategy: SELECT-only for the owner. GPS coordinates + SOS records are
--           forensic data — no INSERT, UPDATE, or DELETE via authenticated role.
--           ALL writes go through service_role (triggerSOS in emergency.service.ts).
-- =============================================================================

ALTER TABLE "EmergencyEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergencyevent_select_own"
  ON "EmergencyEvent"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

-- INSERT  : service_role only (emergency.service.ts → prisma.emergencyEvent.create)
-- UPDATE  : service_role only (status update after SOS processing)
-- DELETE  : NEVER via any role — SOS events are permanent forensic records


-- =============================================================================
-- END OF APPLY SCRIPT
-- =============================================================================
