-- =============================================================================
-- Migration 0048: Comprehensive Performance Indexes
-- Covers all remaining high-traffic and relational access patterns identified
-- across the transitions, benefits, performance, recruitment, LMS, survey,
-- and support modules to ensure all multi-tenant queries use index scans.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- transitions & transition_tasks
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transitions_company_status
  ON transitions (company_id, status);

CREATE INDEX IF NOT EXISTS idx_transitions_company_type_status
  ON transitions (company_id, type, status);

CREATE INDEX IF NOT EXISTS idx_transitions_company_employee
  ON transitions (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_transitions_company_created
  ON transitions (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transition_tasks_transition_sort
  ON transition_tasks (transition_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_transition_tasks_company_status
  ON transition_tasks (company_id, status);

-- ---------------------------------------------------------------------------
-- benefits & wellbeing
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_benefit_plans_company_status
  ON benefit_plans (company_id, status);

CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_company_employee
  ON benefit_enrollments (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_company_plan
  ON benefit_enrollments (company_id, plan_id);

CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_company_status
  ON benefit_enrollments (company_id, status);

CREATE INDEX IF NOT EXISTS idx_benefit_dependents_company_employee
  ON benefit_dependents (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_benefit_claims_company_status
  ON benefit_claims (company_id, status);

CREATE INDEX IF NOT EXISTS idx_benefit_claims_company_employee
  ON benefit_claims (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_wellness_programs_company_status
  ON wellness_programs (company_id, status);

CREATE INDEX IF NOT EXISTS idx_wellness_participants_company_program
  ON wellness_participants (company_id, program_id);

CREATE INDEX IF NOT EXISTS idx_wellness_participants_company_employee
  ON wellness_participants (company_id, employee_id);

-- ---------------------------------------------------------------------------
-- company_documents
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_company_documents_company_created
  ON company_documents (company_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- performance & appraisal (peer_reviews, assessments, goals)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_peer_reviews_company_reviewer
  ON peer_reviews (company_id, reviewer_id);

CREATE INDEX IF NOT EXISTS idx_peer_reviews_company_reviewee
  ON peer_reviews (company_id, reviewee_id);

CREATE INDEX IF NOT EXISTS idx_peer_reviews_company_status
  ON peer_reviews (company_id, status);

CREATE INDEX IF NOT EXISTS idx_assessments_company_employee
  ON assessments (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_assessments_company_cycle
  ON assessments (company_id, cycle_id);

CREATE INDEX IF NOT EXISTS idx_assessments_company_status
  ON assessments (company_id, status);

CREATE INDEX IF NOT EXISTS idx_goals_company_employee
  ON goals (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_goals_company_status
  ON goals (company_id, status);

-- ---------------------------------------------------------------------------
-- surveys & questions
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_surveys_company_status
  ON surveys (company_id, status);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey
  ON survey_questions (survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
  ON survey_responses (survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_employee
  ON survey_responses (employee_id);

CREATE INDEX IF NOT EXISTS idx_survey_answers_response
  ON survey_answers (response_id);

-- ---------------------------------------------------------------------------
-- learning & LMS
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_company_status
  ON courses (company_id, status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course
  ON course_enrollments (course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee
  ON course_enrollments (employee_id);

-- ---------------------------------------------------------------------------
-- support tickets & messages
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_status
  ON support_tickets (company_id, status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_company_employee
  ON support_tickets (company_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_company_created
  ON support_tickets (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON support_ticket_messages (ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- organization structure
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_departments_company
  ON departments (company_id);

CREATE INDEX IF NOT EXISTS idx_locations_company
  ON locations (company_id);

CREATE INDEX IF NOT EXISTS idx_roles_company
  ON roles (company_id);
