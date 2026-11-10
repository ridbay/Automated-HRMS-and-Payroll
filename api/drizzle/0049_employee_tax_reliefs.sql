-- Hand-written, like the other manually-added migrations in this history.
-- The NTA 2025 relief fields were added to employee.model.ts without a
-- migration, so every insert into "employees" failed on unknown columns.
ALTER TABLE employees ADD COLUMN annual_rent integer DEFAULT 0;
ALTER TABLE employees ADD COLUMN nhis_monthly integer DEFAULT 0;
ALTER TABLE employees ADD COLUMN mortgage_interest_annual integer DEFAULT 0;
ALTER TABLE employees ADD COLUMN life_insurance_annual integer DEFAULT 0;
