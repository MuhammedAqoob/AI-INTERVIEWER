-- Store the current unanswered question separately from the conversation.
-- Conversation now contains only completed interview turns.

ALTER TABLE "interview_sessions" ADD COLUMN "current_question" JSONB;
