ALTER TABLE "interview_sessions"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "answer_claim_token" VARCHAR(64),
  ADD COLUMN "answer_claimed_at" TIMESTAMPTZ;

ALTER TABLE "user_performance_aggregates"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "interview_sessions_answer_claimed_at_idx"
  ON "interview_sessions"("answer_claimed_at");
