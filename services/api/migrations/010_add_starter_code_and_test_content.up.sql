-- Add starter_code (per-language templates) to problems
ALTER TABLE problems ADD COLUMN starter_code JSONB DEFAULT '{}';

-- Add inline content columns to test_cases for dev (no S3 needed)
ALTER TABLE test_cases ADD COLUMN input_content TEXT;
ALTER TABLE test_cases ADD COLUMN output_content TEXT;
