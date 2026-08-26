'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Spinner, DifficultyBadge, Button, Textarea, Modal } from '../../../components/ui';

export default function InterviewRoomPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      let res = await interview.details(sessionId);
      if (res.data.status === 'PAUSED') {
        res = await interview.resume(sessionId);
      }
      setData(res.data);
    } catch (err) {
      if (err?.status === 401) router.push('/login');
      else if (err?.status === 403 || err?.status === 404) router.push('/history');
      else setError(err.message || 'Could not continue this interview. Please try again.');
    }
  };

  useEffect(() => {
    load();
  }, [sessionId]);

  const handlePauseAndLeave = async () => {
    setActionLoading(true);
    try {
      if (data?.status === 'ACTIVE') {
        await interview.pause(sessionId);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to pause session.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleCompleteAndLeave = async () => {
    setActionLoading(true);
    try {
      const res = await interview.end(sessionId);
      router.push(`/history/${res.data.sessionId || sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to complete session.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleRetake = async () => {
    setActionLoading(true);
    try {
      const res = await interview.retake(sessionId);
      router.push(`/interview/${res.data.sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to start retake.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const isNonResumeActive = data?.status === 'ACTIVE' && data?.interviewType !== 'RESUME';

  const submit = async () => {
    if (!answer.trim() || sending) return;
    setSending(true);
    try {
      const res = await interview.answer(sessionId, answer);
      setAnswer('');
      if (res.data.interviewEnded) {
        router.push(`/history/${sessionId}`);
      } else {
        await load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          <Spinner className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Connecting to AI Interview Room...</span>
        </div>
      </div>
    );
  }

  const answers = data.answers || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeaveModal(true)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          >
            Leave Chat
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full border border-brand-200/60 dark:border-brand-800/60">
              {data.interviewType}
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Question {data.currentQuestionNumber || answers.length + 1} / {data.questionLimit}
            </span>
          </div>
        </div>
      </header>

      {/* Main Messaging Chat Area */}
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {error && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Messaging History Stream */}
        <div className="space-y-6">
          {answers.map((item) => (
            <div key={item.id} className="space-y-4">
              {/* AI Question (Left Aligned Bubble) */}
              <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md">
                  AI
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      AI Interviewer · Q{item.questionNumber}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-900 dark:text-slate-100 shadow-sm leading-relaxed whitespace-pre-wrap">
                    {item.question}
                  </div>
                </div>
              </div>

              {/* User Answer (Right Aligned Bubble) */}
              <div className="flex items-start justify-end gap-3 max-w-[90%] sm:max-w-[80%] ml-auto">
                <div className="space-y-1.5 text-right">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    You
                  </span>
                  <div className="bg-brand-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm shadow-md leading-relaxed whitespace-pre-wrap text-left">
                    {item.userAnswer}
                  </div>

                  {item.analytics && (
                    <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                      {Object.entries(item.analytics).map(([key, val]) => (
                        <span key={key} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {key}: <strong>{val}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-100 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  You
                </div>
              </div>
            </div>
          ))}

          {/* Current Active AI Question Prompt (Left Aligned Bubble) */}
          {data.currentQuestion && (
            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%] animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md">
                  AI
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      AI Interviewer · Question {data.currentQuestionNumber} of {data.questionLimit}
                    </span>
                    <DifficultyBadge difficulty={data.currentQuestion.difficulty} />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/40 dark:border-brand-500/50 p-4 rounded-2xl rounded-tl-sm text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 shadow-md leading-relaxed whitespace-pre-wrap">
                    {data.currentQuestion.content}
                  </div>
                </div>
              </div>

              {/* User Answer Input Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <Textarea
                  label="Your Response"
                  rows={5}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  maxLength={5000}
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${answer.length > 5000 ? 'text-rose-500' : answer.length > 4500 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {answer.length} / 5,000 characters
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    loading={sending}
                    disabled={!answer.trim() || answer.length > 5000}
                    onClick={submit}
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    }
                  >
                    {sending ? 'Evaluating Response...' : 'Send Answer'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Leave Chat Action Alert Modal */}
      <Modal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Interview?"
        description="Pause to resume later, or complete now to generate your evaluation and finish the interview."
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeaveModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePauseAndLeave}
            loading={actionLoading}
          >
            Pause & Leave
          </Button>
          {isNonResumeActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetake}
              loading={actionLoading}
            >
              Retake Interview
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteAndLeave}
            loading={actionLoading}
          >
            Complete & Leave
          </Button>
        </div>
      </Modal>
    </div>
  );
}
