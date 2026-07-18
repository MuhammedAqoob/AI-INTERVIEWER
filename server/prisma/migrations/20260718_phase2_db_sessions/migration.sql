-- Phase 2: Replace in-memory sessions with DB-backed sessions

-- 1. Drop existing active sessions (no real data to preserve)
DELETE FROM interview_sessions;

-- 2. Drop old columns
ALTER TABLE interview_sessions DROP COLUMN IF EXISTS difficulty;
ALTER TABLE interview_sessions DROP COLUMN IF EXISTS score;

-- 3. Add new columns
ALTER TABLE interview_sessions ADD COLUMN current_difficulty VARCHAR(20) NOT NULL DEFAULT 'EASY';
ALTER TABLE interview_sessions ADD COLUMN conversation JSONB NOT NULL DEFAULT '[]';
ALTER TABLE interview_sessions ADD COLUMN current_question JSONB;
ALTER TABLE interview_sessions ADD COLUMN accumulated_score INT NOT NULL DEFAULT 0;
ALTER TABLE interview_sessions ADD COLUMN life_consumed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE interview_sessions ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE interview_sessions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
