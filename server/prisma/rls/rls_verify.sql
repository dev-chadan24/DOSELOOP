-- =============================================================================
-- DoseLoop — RLS Verification Script
-- =============================================================================
-- Run this AFTER rls_apply.sql to confirm every table is secured correctly.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste entire file → Run
--   OR: psql "$DIRECT_URL" -f rls_verify.sql
--
-- WHAT TO CHECK:
--   Section 1 → All 15 tables must show rowsecurity = TRUE
--   Section 2 → Policy count per table must match expected values
--   Section 3 → No overly permissive policies exist (zero rows = safe)
--   Section 4 → All policies target the `authenticated` role only
-- =============================================================================


-- =============================================================================
-- SECTION 1: RLS Enabled Status for All 15 Tables
-- =============================================================================
-- Expected: rowsecurity = true for every row.
-- =============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity                            AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ OK' ELSE '❌ FAIL' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  )
ORDER BY tablename;


-- =============================================================================
-- SECTION 2: Policy Count Per Table
-- =============================================================================
-- Expected counts (reference):
--   _prisma_migrations    → 0  (implicit deny, no policies needed)
--   User                  → 2  (select, update)
--   Medication            → 4  (select, insert, update, delete)
--   MedicationSchedule    → 4  (select, insert, update, delete)
--   DoseEvent             → 4  (select, insert, update, delete)
--   WellnessMetric        → 4  (select, insert, update, delete)
--   WaterLog              → 4  (select, insert, update, delete)
--   FamilyMember          → 4  (select, insert, update, delete)
--   EmergencyContact      → 4  (select, insert, update, delete)
--   Notification          → 2  (select, update)
--   AssistantConversation → 4  (select, insert, update, delete)
--   AssistantMessage      → 3  (select, insert, delete — no update)
--   AuditLog              → 1  (select only)
--   Feedback              → 2  (select, insert)
--   EmergencyEvent        → 1  (select only)
--   TOTAL                 → 43 policies
-- =============================================================================

SELECT
  tablename,
  COUNT(*)                               AS policy_count,
  array_agg(policyname ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  )
GROUP BY tablename
ORDER BY tablename;


-- =============================================================================
-- SECTION 3: Safety Check — Detect Any Overly Permissive Policies
-- =============================================================================
-- This query searches for policies using USING (true) or WITH CHECK (true).
-- Expected result: ZERO rows. If any row appears, that policy is unsafe.
-- =============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  qual       AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual       = 'true'
    OR with_check = 'true'
    OR qual       IS NULL   -- NULL qual on a non-INSERT policy = permissive
  )
  AND tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  );
-- Expected: 0 rows


-- =============================================================================
-- SECTION 4: Role Binding Check — All Policies Target `authenticated`
-- =============================================================================
-- Expected: Every policy should list {authenticated} in the roles array.
-- No policy should target `anon` or `public` (which would be too permissive).
-- =============================================================================

SELECT
  tablename,
  policyname,
  roles,
  cmd,
  CASE
    WHEN 'anon'   = ANY(roles) THEN '⚠️  WARNING: anon role has access'
    WHEN 'public' = ANY(roles) THEN '⚠️  WARNING: public role has access'
    ELSE '✅ OK'
  END AS role_safety
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  )
ORDER BY tablename, policyname;


-- =============================================================================
-- SECTION 5: Full Policy Detail Audit
-- =============================================================================
-- Human-readable dump of every policy for documentation / audit purposes.
-- =============================================================================

SELECT
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual       AS using_clause,
  p.with_check AS with_check_clause
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  )
ORDER BY p.tablename, p.cmd, p.policyname;


-- =============================================================================
-- SECTION 6: Quick Summary Row
-- =============================================================================
-- Single-row health check. Both counts should satisfy the expected values.
-- =============================================================================

SELECT
  COUNT(DISTINCT t.tablename)  AS tables_with_rls_enabled,
  COUNT(p.policyname)          AS total_policies_created,
  CASE
    WHEN COUNT(DISTINCT t.tablename) = 15 AND COUNT(p.policyname) = 43
    THEN '✅ ALL CHECKS PASSED — RLS fully configured'
    ELSE '❌ MISMATCH — review sections above for details'
  END AS overall_status
FROM pg_tables t
LEFT JOIN pg_policies p
  ON  p.tablename  = t.tablename
  AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND t.tablename IN (
    '_prisma_migrations',
    'User',
    'Medication',
    'MedicationSchedule',
    'DoseEvent',
    'WellnessMetric',
    'WaterLog',
    'FamilyMember',
    'EmergencyContact',
    'Notification',
    'AssistantConversation',
    'AssistantMessage',
    'AuditLog',
    'Feedback',
    'EmergencyEvent'
  );


-- =============================================================================
-- END OF VERIFICATION SCRIPT
-- =============================================================================
