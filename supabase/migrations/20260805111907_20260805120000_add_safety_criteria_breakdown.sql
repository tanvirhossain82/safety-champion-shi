/*
# Store Safety performance sheet category scores

1. New columns
- Adds `evaluations.safety_criteria` as JSONB to preserve the Safety sheet's Positive and Negative category scores for each monthly employee evaluation.
- Positive categories contain PPE, Safe Work (SOP), 5S & Housekeeping, Near Miss Reporting, and Safety Meeting.
- Negative categories contain PPE, Unsafe Work Practice, Housekeeping, Safety Instruction, Chemical Spill, Fire Safety Rule, Accident (Negligence), and Machine Guard.

2. Modified tables
- `evaluations`: adds a nullable JSONB breakdown column. Existing safety_marks, negative_marks, total_marks, and historical evaluation rows remain unchanged.

3. Security
- No new table or access path is introduced. The existing authenticated evaluation CRUD policies continue to protect this column.

4. Important notes
- The existing aggregate marks remain the source used for rankings and reports.
- The new column stores the category-level detail used by the Safety evaluation form and supports editing previously saved records.
*/

ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS safety_criteria jsonb;
