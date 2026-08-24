'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Spinner, TypeBadge, DifficultyBadge, Button, Card, CardContent } from '../../../components/ui';
import { formatDate, formatDateTime, titleCase } from '../../../lib/format';

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      router.push('/history');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await interview.details(id);
      setData(res.data);
    } catch (err) {
      const msg = err.message || '';
      if (err?.status === 401) {
        router.push('/login');
        return;
      }
      if (err?.status === 403 || err?.status === 404 || err?.status === 409) {
        router.push('/history');
        return;
      }
      setError(msg || 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <Spinner className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Loading session details...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <p className="text-rose-600 dark:text-rose-400 font-semibold mb-4">{error}</p>
          <Button variant="primary" onClick={() => router.push('/history')}>
            Back to History
          </Button>
        </Card>
      </div>
    );
  }

  const turns = Array.isArray(data.answers) ? data.answers : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-12">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/history')}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Back
            </Button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Session Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/interview/${id}`)}
            >
              {data.status === 'PAUSED' ? 'Continue Interview' : 'View Room'}
            </Button>
            {data.status === 'COMPLETED' && data.interviewType !== 'RESUME' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await interview.retake(id);
                    router.push(`/interview/${res.data.sessionId}`);
                  } catch (err) {
                    setError(err.message || 'Failed to start retake.');
                  }
                }}
              >
                Retake Interview
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">
        {error && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Metadata Section */}
        <Card className="p-6 border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <TypeBadge type={data.interviewType} />
            {data.branch && (
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {titleCase(data.branch)}
              </span>
            )}
            {data.difficulty && <DifficultyBadge difficulty={data.difficulty} />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
            <Meta label="Status" value={data.status} />
            <Meta label="Question Limit" value={data.questionLimit ?? 0} />
            <Meta label="Answered" value={data.turnCount ?? data.totalQuestions ?? 0} />
            <Meta label="Created" value={formatDate(data.createdAt || data.startedAt)} />
          </div>
          {data.scoreContribution && (
            <ContributionCard
              current={data.scoreContribution.averageScore}
              delta={data.scoreContribution.contribution}
            />
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Last updated {formatDateTime(data.updatedAt)}
          </p>
        </Card>

        {/* Question & Evaluation Breakdown */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Questions & Answers ({turns.length})
          </h2>

          {turns.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-800">
              No questions answered recorded for this session yet.
            </Card>
          ) : (
            <div className="space-y-4">
              {turns.map((turn, i) => (
                <Card key={i} className="border-slate-200/80 dark:border-slate-800">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        Question {turn.questionNumber || i + 1}
                      </span>
                    </div>

                    <Block label="Question" content={turn.question} tone="question" />
                    <Block label="Your Answer" content={turn.userAnswer} tone="user" />
                    {turn.betterAnswer && (
                      <Block label="Better / Suggested Answer" content={turn.betterAnswer} tone="better" />
                    )}

                    {turn.analytics && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                        {Object.entries(turn.analytics).map(([key, val]) => (
                          <span key={key} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {key}: <strong className="text-slate-800 dark:text-slate-200">{val}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
      <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}

function ContributionCard({ current, delta }) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const tone = isPositive
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
    : isNegative
      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
      : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '=';
  const label = isPositive ? 'Raised your score' : isNegative ? 'Lowered your score' : 'No change to your score';

  return (
    <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${tone}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Leaderboard Contribution</p>
        <p className="text-sm font-semibold mt-0.5">{label}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black">
          {arrow} {Math.abs(delta).toFixed(2)}
        </p>
        <p className="text-xs opacity-80 mt-0.5">Current overall: {current.toFixed(2)}</p>
      </div>
    </div>
  );
}

function Block({ label, content, tone }) {
  const toneStyles = {
    question: 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100',
    user: 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-200/60 dark:border-brand-800/60 text-slate-800 dark:text-slate-200',
    better: 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200',
  };

  return (
    <div className={`p-4 rounded-xl border ${toneStyles[tone] || 'bg-slate-50 dark:bg-slate-800'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content || '—'}</p>
    </div>
  );
}
