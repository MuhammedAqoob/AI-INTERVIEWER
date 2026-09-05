'use client';

import { useEffect, useState } from 'react';
import { leaderboard } from '../../lib/api';
import { Spinner, Card, Button } from '../../components/ui';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../components/AuthProvider';

/* ─────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────── */
const Icons = {
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.775.996-1.775 1.943v4.286c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125v-4.286c0-.947-.78-1.765-1.775-1.943M5.25 4.236V3.75A2.25 2.25 0 017.5 1.5h9a2.25 2.25 0 012.25 2.25v.486" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

const MEDALS = {
  1: { emoji: '🥇', bg: 'bg-gradient-to-br from-amber-400 to-amber-500', text: 'text-white', ring: 'ring-amber-300 dark:ring-amber-600', scoreColor: 'text-amber-600 dark:text-amber-400' },
  2: { emoji: '🥈', bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-white', ring: 'ring-slate-200 dark:ring-slate-600', scoreColor: 'text-slate-600 dark:text-slate-300' },
  3: { emoji: '🥉', bg: 'bg-gradient-to-br from-orange-300 to-orange-400', text: 'text-white', ring: 'ring-orange-200 dark:ring-orange-600', scoreColor: 'text-orange-600 dark:text-orange-400' },
};

/* ─────────────────────────────────────────────
   Loading skeleton
   ───────────────────────────────────────────── */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN LEADERBOARD
   ═══════════════════════════════════════════════ */
export default function LeaderboardPage() {
  // Username comes from the shared auth state (single auth.me() per load);
  // the leaderboard itself is public and loads regardless of auth status.
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = user?.username || null;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const lbRes = await leaderboard.list(50);
      setRows(lbRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      <TopNav />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">

        {/* ─── Header ─── */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Leaderboard
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
              Top candidates ranked by overall average interview performance.
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              Signed in as <span className="font-semibold text-slate-900 dark:text-slate-100">{currentUser}</span>
            </div>
          )}
        </section>

        {/* ─── Error ─── */}
        {error && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {loading ? (
          <LeaderboardSkeleton />
        ) : rows.length === 0 ? (
          /* ─── Empty State ─── */
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/40 rounded-2xl flex items-center justify-center mx-auto text-brand-500 dark:text-brand-400">
              {Icons.trophy}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              No leaderboard entries yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Complete any core interview session to qualify for the global leaderboard.
            </p>
          </Card>
        ) : (
          <>
            {/* ─── Top 3 Podium ─── */}
            {top3.length > 0 && (
              <section className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Reorder: 2nd, 1st, 3rd for visual podium */}
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((row, i) => {
                  const actualRank = row.rank;
                  const medal = MEDALS[actualRank];
                  const isCurrent = currentUser && row.username === currentUser;
                  // Visual order: index 0 = 2nd place (shorter), index 1 = 1st place (tallest), index 2 = 3rd place (shortest)
                  const heights = ['pt-4', 'pt-0', 'pt-6'];
                  const avatarSizes = ['w-14 h-14', 'w-18 h-18', 'w-14 h-14'];
                  const avatarSize = actualRank === 1 ? 'w-18 h-18 text-xl' : 'w-14 h-14 text-base';

                  return (
                    <div key={row.username} className={`flex flex-col items-center ${heights[i]}`}>
                      {/* Avatar */}
                      <div className={`relative ${avatarSize} rounded-full flex items-center justify-center font-extrabold shadow-lg ring-4 ${medal.ring} ${medal.bg} ${medal.text} mb-3 transition-transform hover:scale-105`}>
                        {medal.emoji}
                      </div>

                      {/* Name */}
                      <p className={`text-sm font-bold text-center truncate max-w-full ${isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {row.username}
                        {isCurrent && <span className="text-[10px] ml-1 text-brand-600 dark:text-brand-400">(You)</span>}
                      </p>

                      {/* Score */}
                      <p className={`text-2xl font-black mt-1 ${medal.scoreColor}`}>
                        {row.averageScore}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">avg score</p>
                    </div>
                  );
                })}
              </section>
            )}

            {/* ─── Divider ─── */}
            {rest.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
              </div>
            )}

            {/* ─── Rest of leaderboard ─── */}
            {rest.length > 0 && (
              <section className="space-y-2 max-w-3xl mx-auto">
                {rest.map((row) => {
                  const isCurrent = currentUser && row.username === currentUser;
                  return (
                    <div
                      key={row.username}
                      className={`bg-white dark:bg-slate-900 border rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 transition-all duration-200 shadow-sm hover:shadow-md ${
                        isCurrent
                          ? 'border-brand-500 ring-2 ring-brand-500/20 dark:ring-brand-500/30'
                          : 'border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{row.rank}</span>
                        </div>

                        {/* User info */}
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {row.username}
                            {isCurrent && (
                              <span className="ml-2 text-[10px] font-semibold text-brand-700 bg-brand-100 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {row.criteriaCovered}/10 criteria · Tech {row.categoryScores?.TECHNICAL ?? '—'} · HR {row.categoryScores?.HR ?? '—'} · Apt {row.categoryScores?.APTITUDE ?? '—'}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{row.averageScore}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">avg</p>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
