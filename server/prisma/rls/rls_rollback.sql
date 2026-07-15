-- =============================================================================
-- DoseLoop — Row Level Security (RLS) ROLLBACK Script
-- =============================================================================
-- USE THIS ONLY IN AN EMERGENCY to revert all RLS changes instantly.
--
-- This script:
--   1. Drops every policy created by rls_apply.sql
--   2. Disables RLS on every table
--
-- After running this, your tables return to their original state
-- (RLS disabled, no policies). Re-run rls_apply.sql to re-secure.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste entire file → Run
--   OR: psql "$DIRECT_URL" -f rls_rollback.sql
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TABLE 0: _prisma_migrations
-- ---------------------------------------------------------------------------
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;
-- (no policies were created for this table)


-- ---------------------------------------------------------------------------
-- TABLE 1: User
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_select_own"  ON "User";
DROP POLICY IF EXISTS "user_update_own"  ON "User";
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 2: Medication
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "medication_select_own"  ON "Medication";
DROP POLICY IF EXISTS "medication_insert_own"  ON "Medication";
DROP POLICY IF EXISTS "medication_update_own"  ON "Medication";
DROP POLICY IF EXISTS "medication_delete_own"  ON "Medication";
ALTER TABLE "Medication" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 3: MedicationSchedule
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "medschedule_select_own"  ON "MedicationSchedule";
DROP POLICY IF EXISTS "medschedule_insert_own"  ON "MedicationSchedule";
DROP POLICY IF EXISTS "medschedule_update_own"  ON "MedicationSchedule";
DROP POLICY IF EXISTS "medschedule_delete_own"  ON "MedicationSchedule";
ALTER TABLE "MedicationSchedule" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 4: DoseEvent
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "doseevent_select_own"  ON "DoseEvent";
DROP POLICY IF EXISTS "doseevent_insert_own"  ON "DoseEvent";
DROP POLICY IF EXISTS "doseevent_update_own"  ON "DoseEvent";
DROP POLICY IF EXISTS "doseevent_delete_own"  ON "DoseEvent";
ALTER TABLE "DoseEvent" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 5: WellnessMetric
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "wellnessmetric_select_own"  ON "WellnessMetric";
DROP POLICY IF EXISTS "wellnessmetric_insert_own"  ON "WellnessMetric";
DROP POLICY IF EXISTS "wellnessmetric_update_own"  ON "WellnessMetric";
DROP POLICY IF EXISTS "wellnessmetric_delete_own"  ON "WellnessMetric";
ALTER TABLE "WellnessMetric" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 6: WaterLog
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "waterlog_select_own"  ON "WaterLog";
DROP POLICY IF EXISTS "waterlog_insert_own"  ON "WaterLog";
DROP POLICY IF EXISTS "waterlog_update_own"  ON "WaterLog";
DROP POLICY IF EXISTS "waterlog_delete_own"  ON "WaterLog";
ALTER TABLE "WaterLog" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 7: FamilyMember
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "familymember_select_own"  ON "FamilyMember";
DROP POLICY IF EXISTS "familymember_insert_own"  ON "FamilyMember";
DROP POLICY IF EXISTS "familymember_update_own"  ON "FamilyMember";
DROP POLICY IF EXISTS "familymember_delete_own"  ON "FamilyMember";
ALTER TABLE "FamilyMember" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 8: EmergencyContact
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "emergencycontact_select_own"  ON "EmergencyContact";
DROP POLICY IF EXISTS "emergencycontact_insert_own"  ON "EmergencyContact";
DROP POLICY IF EXISTS "emergencycontact_update_own"  ON "EmergencyContact";
DROP POLICY IF EXISTS "emergencycontact_delete_own"  ON "EmergencyContact";
ALTER TABLE "EmergencyContact" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 9: Notification
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "notification_select_own"  ON "Notification";
DROP POLICY IF EXISTS "notification_update_own"  ON "Notification";
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 10: AssistantConversation
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "assistantconv_select_own"  ON "AssistantConversation";
DROP POLICY IF EXISTS "assistantconv_insert_own"  ON "AssistantConversation";
DROP POLICY IF EXISTS "assistantconv_update_own"  ON "AssistantConversation";
DROP POLICY IF EXISTS "assistantconv_delete_own"  ON "AssistantConversation";
ALTER TABLE "AssistantConversation" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 11: AssistantMessage
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "assistantmsg_select_own"  ON "AssistantMessage";
DROP POLICY IF EXISTS "assistantmsg_insert_own"  ON "AssistantMessage";
DROP POLICY IF EXISTS "assistantmsg_delete_own"  ON "AssistantMessage";
ALTER TABLE "AssistantMessage" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 12: AuditLog
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auditlog_select_own"  ON "AuditLog";
ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 13: Feedback
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "feedback_select_own"  ON "Feedback";
DROP POLICY IF EXISTS "feedback_insert_own"  ON "Feedback";
ALTER TABLE "Feedback" DISABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- TABLE 14: EmergencyEvent
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "emergencyevent_select_own"  ON "EmergencyEvent";
ALTER TABLE "EmergencyEvent" DISABLE ROW LEVEL SECURITY;


-- =============================================================================
-- END OF ROLLBACK SCRIPT
-- =============================================================================
