'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Spinner, TypeBadge, DifficultyBadge } from '../../../components/ui';
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
      if (msg.includes('404') || msg.includes('not found') || msg.includes('403') || msg.includes('Unauthorized')) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/history')}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const turns = Array.isArray(data.answers) ? data.answers : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/history')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Session Details</h1>
            </div>
            <button
              onClick={() => router.push(`/interview/${id}`)}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              {data.status === 'PAUSED' ? 'Continue' : 'View Interview'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Metadata */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <TypeBadge type={data.interviewType} />
            {data.branch && (
              <span className="text-lg font-semibold text-gray-900">
                {titleCase(data.branch)}
              </span>
            )}
            {data.difficulty && <DifficultyBadge difficulty={data.difficulty} />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Meta label="Status" value={data.status} />
            <Meta label="Question Limit" value={data.questionLimit ?? 0} />
            <Meta label="Answered" value={data.turnCount ?? data.totalQuestions ?? 0} />
            <Meta label="Created" value={formatDate(data.createdAt || data.startedAt)} />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Last updated {formatDateTime(data.updatedAt)}
          </p>
        </section>

        {/* Conversation */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            Questions ({turns.length})
          </h2>
          {turns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              No turns recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Question {turn.questionNumber || i + 1}
                    </span>
                  </div>
                  <Block label="Question" content={turn.question} />
                  <Block label="Your Answer" content={turn.userAnswer} tone="user" />
                  {turn.betterAnswer && (
                    <Block label="Better Answer" content={turn.betterAnswer} tone="better" />
                  )}
                  <div className="text-xs text-gray-500">{Object.entries(turn.analytics || {}).map(([key, value]) => `${key}: ${value}`).join(' · ')}</div>
                </div>
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
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Block({ label, content, tone }) {
  const tones = {
    user: 'bg-blue-50 border-blue-200',
    feedback: 'bg-amber-50 border-amber-200',
    better: 'bg-emerald-50 border-emerald-200',
    explain: 'bg-blue-50 border-blue-200',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone] || 'bg-gray-50 border-gray-200'}`}>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{content || '—'}</p>
    </div>
  );
}
