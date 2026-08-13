/*
# Add Department KPI Criteria Table

## Purpose
Each department has its own set of KPI criteria (name + max marks) used during
department evaluations. Previously these were hardcoded in the frontend. This
migration creates a `dept_kpi_criteria` table so admins/department heads can
view, edit, add, remove, and reorder criteria per department — changes persist
to the database and immediately affect the evaluation dialog.

## New Table
- `dept_kpi_criteria`
  - `id` (uuid, primary key)
  - `department` (text, not null) — e.g. Emulsion, Maintenance, MRP, Solvent, Technical, Warehouse
  - `name` (text, not null) — criterion name
  - `max` (numeric, not null, default 5) — max marks for this criterion
  - `sort_order` (int, default 0) — display order
  - `created_at` (timestamptz, default now())
  - Unique constraint on (department, name)

## Seed Data
Seeded with the existing hardcoded criteria for all 6 departments.

## Security
- RLS enabled
- SELECT: any authenticated user can read (needed to render evaluation dialog)
- INSERT / UPDATE / DELETE: any authenticated user can modify (admin/dept_head manage criteria)
*/

CREATE TABLE IF NOT EXISTS dept_kpi_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  name text NOT NULL,
  max numeric(6,2) NOT NULL DEFAULT 5,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (department, name)
);

ALTER TABLE dept_kpi_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_kpi_criteria" ON dept_kpi_criteria;
CREATE POLICY "auth_select_kpi_criteria" ON dept_kpi_criteria FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_kpi_criteria" ON dept_kpi_criteria;
CREATE POLICY "auth_insert_kpi_criteria" ON dept_kpi_criteria FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_kpi_criteria" ON dept_kpi_criteria;
CREATE POLICY "auth_update_kpi_criteria" ON dept_kpi_criteria FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_kpi_criteria" ON dept_kpi_criteria;
CREATE POLICY "auth_delete_kpi_criteria" ON dept_kpi_criteria FOR DELETE
  TO authenticated USING (true);

-- Seed existing criteria
INSERT INTO dept_kpi_criteria (department, name, max, sort_order) VALUES
  ('Emulsion', 'Efficiency', 10, 1),
  ('Emulsion', 'Lead Time', 10, 2),
  ('Emulsion', 'Team Work', 5, 3),
  ('Emulsion', 'Attitude', 5, 4),
  ('Emulsion', 'Responsibility', 5, 5),
  ('Emulsion', 'Accuracy', 5, 6),
  ('Emulsion', 'Waste Mgmt', 5, 7),
  ('Maintenance', 'Preventive Maintenance', 10, 1),
  ('Maintenance', 'Breakdown Response & Repair Efficiency', 10, 2),
  ('Maintenance', 'Teamwork', 5, 3),
  ('Maintenance', 'Attitude', 5, 4),
  ('Maintenance', 'Responsibility', 5, 5),
  ('Maintenance', 'Claning', 5, 6),
  ('Maintenance', 'Work Quality & Technical Skill', 5, 7),
  ('MRP', 'Unloading Efficiency', 10, 1),
  ('MRP', 'Supply Lead', 10, 2),
  ('MRP', 'Teamwork', 5, 3),
  ('MRP', 'Attitude', 5, 4),
  ('MRP', 'Responsibility', 5, 5),
  ('MRP', 'Supply Accuracy', 5, 6),
  ('MRP', 'Material Waste', 5, 7),
  ('Solvent', 'Efficiency', 10, 1),
  ('Solvent', 'Lead Time', 10, 2),
  ('Solvent', 'Teamwork', 5, 3),
  ('Solvent', 'Attitude', 5, 4),
  ('Solvent', 'Responsibility', 5, 5),
  ('Solvent', 'Accuracy', 5, 6),
  ('Solvent', 'Waste Mgmt', 5, 7),
  ('Technical', 'Test Accuracy', 5, 1),
  ('Technical', 'R&D Lead Time', 10, 2),
  ('Technical', 'Teamwork', 5, 3),
  ('Technical', 'Attitude', 5, 4),
  ('Technical', 'Responsibility', 5, 5),
  ('Technical', 'Claning', 10, 6),
  ('Technical', 'Documentation', 5, 7),
  ('Warehouse', 'Inventory Accuracy', 10, 1),
  ('Warehouse', 'Order Fulfillment', 10, 2),
  ('Warehouse', 'Teamwork', 5, 3),
  ('Warehouse', 'Attitude', 5, 4),
  ('Warehouse', 'Responsibility', 5, 5),
  ('Warehouse', 'Accuracy', 5, 6),
  ('Warehouse', 'Storage Management', 5, 7)
ON CONFLICT (department, name) DO NOTHING;
