/*
# Add hr_criteria column to evaluations

1. New columns
- `evaluations.hr_criteria` as JSONB to store the HR sheet's Positive and Negative category scores for each monthly employee evaluation.

2. Modified tables
- `evaluations`: adds a nullable JSONB breakdown column. Existing aggregate marks and historical rows remain unchanged.

3. Security
- No new table or access path. Existing authenticated evaluation CRUD policies continue to protect this column.
*/

ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS hr_criteria jsonb;
