/*
# Add editable safety criteria table

1. New Tables
- `safety_criteria`: one row per safety scoring category.
  - `section` ('positive' or 'negative'), `key` (stable identifier), `label`, `max` (points), `sort_order`.
2. Seed
- Inserts the current 5 positive and 9 negative categories with their existing max values.
3. Security
- Row level security enabled.
- Signed-in users can read the criteria.
- Only admins (is_admin) can insert, update or delete criteria.
*/

CREATE TABLE IF NOT EXISTS safety_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('positive', 'negative')),
  key text NOT NULL,
  label text NOT NULL,
  max numeric NOT NULL CHECK (max >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (section, key)
);

ALTER TABLE safety_criteria ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON safety_criteria TO authenticated;
GRANT INSERT, UPDATE, DELETE ON safety_criteria TO authenticated;

DROP POLICY IF EXISTS "select_safety_criteria" ON safety_criteria;
CREATE POLICY "select_safety_criteria" ON safety_criteria FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_safety_criteria_admin" ON safety_criteria;
CREATE POLICY "insert_safety_criteria_admin" ON safety_criteria FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "update_safety_criteria_admin" ON safety_criteria;
CREATE POLICY "update_safety_criteria_admin" ON safety_criteria FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_safety_criteria_admin" ON safety_criteria;
CREATE POLICY "delete_safety_criteria_admin" ON safety_criteria FOR DELETE
  TO authenticated USING (is_admin(auth.uid()));

INSERT INTO safety_criteria (section, key, label, max, sort_order) VALUES
  ('positive', 'ppe', 'PPE', 5, 1),
  ('positive', 'safe_work_sop', 'Safe Work (SOP)', 5, 2),
  ('positive', 'housekeeping_5s', '5S & Housekeeping', 10, 3),
  ('positive', 'near_miss_reporting', 'Near Miss Reporting', 5, 4),
  ('positive', 'safety_meeting', 'Safety Meeting', 5, 5),
  ('negative', 'ppe', 'PPE', 3, 1),
  ('negative', 'unsafe_work_practice', 'Unsafe Work Practice', 3, 2),
  ('negative', 'housekeeping', 'Housekeeping', 2, 3),
  ('negative', 'safety_instruction', 'Safety Instruction', 5, 4),
  ('negative', 'chemical_spill', 'Chemical Spill', 5, 5),
  ('negative', 'fire_safety_rule', 'Fire Safety Rule', 5, 6),
  ('negative', 'accident_negligence', 'Accident (Negligence)', 5, 7),
  ('negative', 'machine_guard', 'Machine Guard', 2, 8)
ON CONFLICT (section, key) DO NOTHING;
