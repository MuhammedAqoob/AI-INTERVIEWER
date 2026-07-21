CREATE TABLE "user_performance_aggregates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "core_sums" JSONB NOT NULL DEFAULT '{}',
  "core_counts" JSONB NOT NULL DEFAULT '{}',
  "resume_high_scores" JSONB NOT NULL DEFAULT '{}',
  "total_answers" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_performance_aggregates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_performance_aggregates_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "user_performance_aggregates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
