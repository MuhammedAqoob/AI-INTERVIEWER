-- DropForeignKey
ALTER TABLE "daily_interview_usage" DROP CONSTRAINT "daily_interview_usage_user_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_answers" DROP CONSTRAINT "interview_answers_session_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_sessions" DROP CONSTRAINT "interview_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_performance_aggregates" DROP CONSTRAINT "user_performance_aggregates_user_id_fkey";

-- DropIndex
DROP INDEX "interview_sessions_answer_claimed_at_idx";

-- AlterTable
ALTER TABLE "daily_interview_usage" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_answers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_question_bank" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "opening_question_content" TEXT,
ADD COLUMN     "opening_question_difficulty" VARCHAR(20),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_performance_aggregates" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "user_performance_aggregates" ADD CONSTRAINT "user_performance_aggregates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_interview_usage" ADD CONSTRAINT "daily_interview_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
