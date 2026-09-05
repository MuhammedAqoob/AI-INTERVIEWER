'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard } from '../../lib/api';
import TopNav from '../../components/TopNav';
import AnalyticsChart from '../../components/AnalyticsChart';
import { Button, Card } from '../../components/ui';
import { useAuth } from '../../components/AuthProvider';

export default function AnalyticsPage() {
  const router = useRouter();
  const { status, markGuest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadedRef = useRef(false);

  // Data loads only after the shared auth check proves the session; guests are
  // redirected and an unreachable backend is never treated as logged out.
  useEffect(() => {
    if (status === 'guest') {
      // replace so Back from the login page goes to wherever the user was
      // before the analytics page (not straight back into this guest redirect).
      router.replace('/login');
      return;
    }
    if (status === 'pending') return;
    if (status === 'unavailable') {
      setError('Unable to reach the server. Please check your connection and try again.');
      setLoading(false);
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboard.summary();
      setStats(res.data);
    } catch (err) {
      if (err?.status === 401) markGuest();
      else setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const analytics = stats?.analytics || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      <TopNav />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Analytics & Skill Matrix
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track competency ratings across your technical, HR, aptitude, and resume sessions.
          </p>
        </div>

        {/* Error banner only when stale data is still shown below */}
        {error && stats && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-center justify-between gap-3">
            <span>Couldn't refresh your analytics. Showing your last loaded results.</span>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {loading ? (
          /* ─── Chart-card skeletons, same system as the rest of the app ─── */
          <div className="space-y-6" aria-busy="true" aria-label="Loading your analytics">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-5 w-48 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="h-9 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm space-y-2">
                  <div className="h-7 w-10 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-2.5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : error && !stats ? (
          /* ─── Friendly error (never the empty state, never raw text) ─── */
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Couldn't load your analytics
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Something went wrong while fetching your skill matrix. Check your connection and try again.
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={load}>Try Again</Button>
            </div>
          </Card>
        ) : Object.values(analytics).every((group) =>
            Object.values(group || {}).every((value) => !value)
          ) ? (
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/40 rounded-2xl flex items-center justify-center mx-auto text-brand-500 dark:text-brand-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              No analytics data yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Complete interviews to build your personal competency matrix.
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => router.push('/interview/setup')}>
                Start an Interview
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.entries(analytics).map(([type, group]) => (
              <Card key={type} className="p-6">
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  {type} Interview Skills
                </h2>
                <AnalyticsChart analytics={group} />
              </Card>
            ))}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <Mini label="Total Sessions" value={stats.totalSessions ?? 0} />
            <Mini label="Eligible Sessions" value={stats.leaderboardEligibleSessions ?? 0} />
            <Mini label="Technical Count" value={stats.interviewCounts?.technical ?? 0} />
            <Mini label="HR Count" value={stats.interviewCounts?.hr ?? 0} />
          </div>
        )}
      </main>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
