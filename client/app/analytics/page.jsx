'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboard } from '../../lib/api';
import TopNav from '../../components/TopNav';
import AnalyticsChart from '../../components/AnalyticsChart';
import { Spinner } from '../../components/ui';

const LABELS = {
  technicalKnowledge: 'Technical Knowledge',
  communication: 'Communication',
  problemSolving: 'Problem Solving',
  confidence: 'Confidence',
  grammar: 'Grammar',
  leadership: 'Leadership',
  teamwork: 'Teamwork',
  relevance: 'Relevance',
  professionalism: 'Professionalism',
};

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
    <div className="min-h-screen bg-gray-50">
      <TopNav username={user?.username} />

      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Resume interviews can improve an existing core competency, but never reduce it.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Spinner className="w-8 h-8 text-blue-600" />
          </div>
        ) : Object.values(analytics).every((group) => Object.values(group || {}).every((value) => !value)) ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No analytics yet.</h2>
            <p className="text-sm text-gray-500 mb-6">
              Complete interviews to build your competency profile.
            </p>
            <button
              onClick={() => router.push('/interview/setup')}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start an Interview
            </button>
          </div>
        ) : (
          <div className="grid gap-6">{Object.entries(analytics).map(([type, group]) => <section key={type} className="bg-white rounded-2xl border border-gray-200 p-6"><h2 className="font-semibold text-gray-900 mb-4">{type} Interview</h2><AnalyticsChart analytics={group} /></section>)}</div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Mini label="Total Sessions" value={stats.totalSessions ?? 0} />
            <Mini label="Eligible" value={stats.leaderboardEligibleSessions ?? 0} />
            <Mini label="Technical" value={stats.interviewCounts?.technical ?? 0} />
            <Mini label="HR" value={stats.interviewCounts?.hr ?? 0} />
          </div>
        )}
      </main>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
