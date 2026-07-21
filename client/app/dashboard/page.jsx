'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, dashboard } from '../../lib/api';
import { StatCard } from '../../components/ui';
import TopNav from '../../components/TopNav';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null); const [stats, setStats] = useState(null); const [error, setError] = useState('');
  useEffect(() => { Promise.all([auth.me(), dashboard.summary()]).then(([me, summary]) => { setUser(me.data.user); setStats(summary.data); }).catch((err) => { if (/token|Access denied/i.test(err.message)) router.push('/login'); else setError(err.message); }); }, [router]);
  const counts = stats?.interviewCounts || {};
  if (!stats && !error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  return <div className="min-h-screen bg-gray-50"><TopNav username={user?.username}/><main className="max-w-4xl mx-auto py-10 px-4">
    {error && <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Interviews Remaining" value={stats?.interviewsRemainingToday ?? 5} sub="today" color="text-rose-600"/>
      <StatCard label="Completed" value={stats?.completedInterviews ?? 0} sub="interviews" color="text-blue-600"/>
      <StatCard label="Total Sessions" value={stats?.totalSessions ?? 0} sub="all types" color="text-emerald-600"/>
      <StatCard label="Technical" value={counts.technical ?? 0} sub="sessions" color="text-amber-600"/>
      <StatCard label="HR" value={counts.hr ?? 0} sub="sessions" color="text-teal-600"/>
      <StatCard label="Resume" value={counts.resume ?? 0} sub="sessions" color="text-purple-600"/>
      <StatCard label="Aptitude" value={counts.aptitude ?? 0} sub="sessions" color="text-indigo-600"/>
    </div>
    {stats?.continueSessionId && <button onClick={() => router.push(`/interview/${stats.continueSessionId}`)} className="mb-6 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Continue Interview</button>}
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"><h1 className="text-2xl font-bold text-gray-900 mb-2">Ready to Interview?</h1><p className="text-gray-500 mb-6">Start a focused interview, then review every answer in History.</p><div className="flex justify-center gap-3"><button onClick={() => router.push('/interview/setup')} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700">Start New Interview</button><button onClick={() => router.push('/history')} className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">History</button><button onClick={() => router.push('/leaderboard')} className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Leaderboard</button></div>{stats?.interviewsRemainingToday <= 0 && <p className="mt-3 text-sm text-gray-400">You have reached today&apos;s interview limit.</p>}</section>
  </main></div>;
}
