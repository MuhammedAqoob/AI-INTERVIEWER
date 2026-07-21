-- Phase 3: Persistent interview session architecture.
-- Drop the old status/expiry-driven table and recreate with the new turn-based,
-- single-analytics design. Existing conversation/analytics data is incompatible
-- with the new format and is intentionally discarded.

DROP TABLE IF EXISTS "interview_sessions";

CREATE TABLE "interview_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "branch" VARCHAR(50),
    "interview_type" VARCHAR(50) NOT NULL,
    "current_difficulty" VARCHAR(20) NOT NULL,
    "conversation" JSONB NOT NULL DEFAULT '[]',
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "resume_summary" TEXT,
    "analytics_average" JSONB NOT NULL DEFAULT '{}',
    "analytics_samples" INTEGER NOT NULL DEFAULT 0,
    "overall_average" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "interview_sessions_user_id_updated_at_idx" ON "interview_sessions"("user_id", "updated_at");

CREATE INDEX "interview_sessions_user_id_interview_type_idx" ON "interview_sessions"("user_id", "interview_type");

ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
