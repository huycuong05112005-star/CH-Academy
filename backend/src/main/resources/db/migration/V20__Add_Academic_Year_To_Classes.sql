-- ====================================================================
-- V20: Add Academic Year Column to Classes for Academic Year Scoping
-- ====================================================================

ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);

-- Backfill existing classes based on start_date (standard Vietnamese academic year: Sept 1 - Aug 31)
UPDATE classes
SET academic_year = CASE
    WHEN EXTRACT(MONTH FROM start_date) >= 9 THEN
        EXTRACT(YEAR FROM start_date)::int || '-' || (EXTRACT(YEAR FROM start_date)::int + 1)
    ELSE
        (EXTRACT(YEAR FROM start_date)::int - 1) || '-' || EXTRACT(YEAR FROM start_date)::int
END
WHERE academic_year IS NULL AND start_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

