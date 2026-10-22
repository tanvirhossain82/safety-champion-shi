/*
# Add General Admin department

1. Modified Tables
- `employees.department` now accepts `General Admin` in addition to the existing departments.
- `profiles.department` now accepts `General Admin` for staff profiles assigned to that department.

2. Application Behavior
- The shared department list used by employee creation, employee import, employee filters, and profile typing will include `General Admin`.
- Existing employee and profile rows are unchanged.

3. Security
- Existing row-level security policies and grants are preserved.
- No new table or permission is introduced.

4. Important Notes
- This migration only widens the allowed department values.
- No data is deleted, renamed, or converted.
*/

ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_department_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_department_check
  CHECK (department = ANY (ARRAY['MRP'::text, 'Warehouse'::text, 'Emulsion'::text, 'Solvent'::text, 'Maintenance'::text, 'Technical'::text, 'General Admin'::text]));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_department_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_department_check
  CHECK ((department = ANY (ARRAY['MRP'::text, 'Warehouse'::text, 'Emulsion'::text, 'Solvent'::text, 'Maintenance'::text, 'Technical'::text, 'General Admin'::text])) OR department IS NULL);
