-- Interview data is intentionally discarded. Authentication data in users is preserved.
DROP TABLE IF EXISTS "user_stats" CASCADE;
DROP TABLE IF EXISTS "interview_answers" CASCADE;
DROP TABLE IF EXISTS "interview_question_bank" CASCADE;
DROP TABLE IF EXISTS "daily_interview_usage" CASCADE;
DROP TABLE IF EXISTS "interview_sessions" CASCADE;

CREATE TABLE "interview_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "interview_type" VARCHAR(20) NOT NULL, "branch" VARCHAR(50), "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "question_limit" INTEGER NOT NULL, "current_question_number" INTEGER NOT NULL DEFAULT 1,
  "current_question" JSONB, "current_difficulty" VARCHAR(20) NOT NULL DEFAULT 'EASY',
  "rolling_summary" TEXT NOT NULL DEFAULT '', "resume_summary" TEXT,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "ended_at" TIMESTAMPTZ,
  "overall_summary" TEXT, "strengths" JSONB DEFAULT '[]', "weaknesses" JSONB DEFAULT '[]',
  "hire_recommendation" VARCHAR(30), "hire_reason" TEXT, "learning_roadmap" JSONB DEFAULT '[]',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "interview_sessions_question_limit_check" CHECK ("question_limit" IN (5, 10, 20))
);
CREATE TABLE "interview_answers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "session_id" UUID NOT NULL, "question_number" INTEGER NOT NULL,
  "question" TEXT NOT NULL, "user_answer" TEXT NOT NULL, "better_answer" TEXT NOT NULL,
  "difficulty" VARCHAR(20) NOT NULL, "analytics_json" JSONB NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interview_answers_session_id_question_number_key" UNIQUE ("session_id", "question_number"),
  CONSTRAINT "interview_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE
);
CREATE TABLE "interview_question_bank" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "interview_type" VARCHAR(20) NOT NULL, "branch" VARCHAR(50),
  "difficulty" VARCHAR(20) NOT NULL, "question" TEXT NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "interview_question_bank_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "daily_interview_usage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "date" DATE NOT NULL,
  "interviews_started" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "daily_interview_usage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_interview_usage_user_id_date_key" UNIQUE ("user_id", "date"),
  CONSTRAINT "daily_interview_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "interview_sessions_user_id_updated_at_idx" ON "interview_sessions"("user_id", "updated_at");
CREATE INDEX "interview_sessions_user_id_status_idx" ON "interview_sessions"("user_id", "status");
CREATE INDEX "interview_sessions_user_id_interview_type_idx" ON "interview_sessions"("user_id", "interview_type");
CREATE INDEX "interview_answers_session_id_question_number_idx" ON "interview_answers"("session_id", "question_number");
CREATE INDEX "interview_question_bank_interview_type_branch_is_active_idx" ON "interview_question_bank"("interview_type", "branch", "is_active");

INSERT INTO "interview_question_bank" ("interview_type", "branch", "difficulty", "question") VALUES
('TECHNICAL','COMPUTER_SCIENCE','EASY','What is polymorphism and where would you use it?'),
('TECHNICAL','ELECTRONICS','EASY','What is a diode and how does it work?'),
('TECHNICAL','MECHANICAL','EASY','What is the difference between heat and temperature?'),
('TECHNICAL','CIVIL','EASY','Explain the difference between one-way and two-way slabs.'),
('TECHNICAL','ELECTRICAL','EASY','What is the difference between AC and DC current?'),
('HR',NULL,'EASY','Tell me about yourself.'),
('HR',NULL,'MEDIUM','Describe a challenging project and how you handled it.'),
('APTITUDE',NULL,'EASY','What comes next in the sequence: 2, 6, 12, 20, 30, ?'),
('APTITUDE',NULL,'MEDIUM','A train travels 360 km in 4 hours. What is its average speed?');
