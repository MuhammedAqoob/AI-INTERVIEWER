-- CreateIndex
CREATE INDEX "interview_sessions_user_id_interview_type_branch_idx" ON "interview_sessions"("user_id", "interview_type", "branch");
