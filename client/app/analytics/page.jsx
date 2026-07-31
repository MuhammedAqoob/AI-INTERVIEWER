'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard } from '../../lib/api';
import TopNav from '../../components/TopNav';
import AnalyticsChart from '../../components/AnalyticsChart';
import { Spinner, Button, Card } from '../../components/ui';

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json());
      if (!meRes?.data?.user) {
        router.push('/login');
        return;
      }
      setUser(meRes.data.user);
      const res = await dashboard.summary();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const analytics = stats?.analytics || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-12">
      <TopNav username={user?.username} />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Skill Matrix
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track competency ratings across your technical, HR, aptitude, and resume sessions.
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
        ) : Object.values(analytics).every((group) =>
            Object.values(group || {}).every((value) => !value)
          ) ? (
          <Card className="p-12 text-center border-slate-200/80 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              No analytics data yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Complete interviews to build your personal competency matrix.
            </p>
            <Button variant="primary" onClick={() => router.push('/interview/setup')}>
              Start an Interview
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.entries(analytics).map(([type, group]) => (
              <Card key={type} className="p-6 border-slate-200/80 dark:border-slate-800">
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
