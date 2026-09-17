-- =============================================================================
-- Migration 0044: Link hired candidates to their employee record
-- Closes the ATS -> Workforce gap: accepting an offer used to leave the
-- candidate at status 'hired' with no employee record and no link back to
-- one. AtsService.respondToOffer now creates the employee record and stamps
-- this column so the pipeline traces through to onboarding.
-- =============================================================================

ALTER TABLE `candidates` ADD `hired_employee_id` text REFERENCES employees(id);
