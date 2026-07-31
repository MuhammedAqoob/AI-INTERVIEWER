'use client';

import { useEffect, useState } from 'react';
import { leaderboard, auth } from '../../lib/api';
import { Spinner, Card } from '../../components/ui';
import TopNav from '../../components/TopNav';

const MEDALS = {
  1: { emoji: '🥇', ring: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30', label: 'text-amber-600 dark:text-amber-400' },
  2: { emoji: '🥈', ring: 'border-slate-300 bg-slate-100/50 dark:bg-slate-800/40', label: 'text-slate-600 dark:text-slate-300' },
  3: { emoji: '🥉', ring: 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/30', label: 'text-orange-600 dark:text-orange-400' },
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [lbRes, meRes] = await Promise.all([
        leaderboard.list(50),
        auth.me().catch(() => null),
      ]);
      setRows(lbRes.data || []);
      setCurrentUser(meRes?.data?.user?.username || null);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-12">
      <TopNav username={currentUser || undefined} />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Leaderboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top candidates ranked by overall average interview evaluation scores.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Spinner className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center border-slate-200/80 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              No leaderboard entries yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete any core interview session to qualify for the global leaderboard.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const isCurrent = currentUser && row.username === currentUser;
              const medal = MEDALS[row.rank];
              return (
                <div
                  key={row.username}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-200 shadow-sm ${
                    isCurrent
                      ? 'border-brand-500 ring-2 ring-brand-500/20 dark:ring-brand-500/30'
                      : medal
                      ? `${medal.ring}`
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-base font-extrabold flex-shrink-0 ${
                        medal
                          ? 'bg-white dark:bg-slate-800 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {medal ? medal.emoji : row.rank}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={`font-bold truncate text-base ${
                          isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {row.username}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-semibold text-brand-700 bg-brand-100 dark:bg-brand-950 dark:text-brand-300 px-2.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.criteriaCovered}/10 core criteria evaluated
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-black ${medal ? medal.label : 'text-slate-900 dark:text-slate-100'}`}>
                      {row.averageScore}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Avg Score</p>
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Tech: {row.categoryScores?.TECHNICAL ?? '-'} · HR: {row.categoryScores?.HR ?? '-'} · Apt: {row.categoryScores?.APTITUDE ?? '-'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
