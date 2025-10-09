-- Migration to update credibility ratings from integer to real (decimal)
-- This allows storing decimal values like 5.5, 7.2, etc.

-- First, add new columns with real type
ALTER TABLE creators ADD COLUMN credibility_rating_new REAL NOT NULL DEFAULT 0;
ALTER TABLE creators ADD COLUMN total_credibility_score_new REAL NOT NULL DEFAULT 0;

-- Copy existing integer values to new real columns
UPDATE creators SET 
  credibility_rating_new = credibility_rating::REAL,
  total_credibility_score_new = total_credibility_score::REAL;

-- Drop the old integer columns
ALTER TABLE creators DROP COLUMN credibility_rating;
ALTER TABLE creators DROP COLUMN total_credibility_score;

-- Rename the new columns to the original names
ALTER TABLE creators RENAME COLUMN credibility_rating_new TO credibility_rating;
ALTER TABLE creators RENAME COLUMN total_credibility_score_new TO total_credibility_score;

-- Add constraints
ALTER TABLE creators ADD CONSTRAINT creators_credibility_rating_check CHECK (credibility_rating >= 0 AND credibility_rating <= 10);
ALTER TABLE creators ADD CONSTRAINT creators_total_credibility_score_check CHECK (total_credibility_score >= 0);
