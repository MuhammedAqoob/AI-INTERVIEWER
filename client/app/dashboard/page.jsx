'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, dashboard } from '../../lib/api';
import { useSessions } from '../../lib/useSessions';
import { StatCard, Button, Spinner, Card, DeleteDialog, CardSkeleton } from '../../components/ui';
import TopNav from '../../components/TopNav';
import SessionCard from '../../components/SessionCard';
import AnalyticsChart from '../../components/AnalyticsChart';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const { sessions, loading: sessionsLoading, load: loadSessions, remove: removeSession, deletingId } = useSessions();

  useEffect(() => {
    Promise.all([auth.me(), dashboard.summary()])
      .then(([me, summary]) => {
        setUser(me.data.user);
        setStats(summary.data);
      })
      .catch((err) => {
        if (err?.status === 401) {
          router.push('/login');
        } else {
          setError(err.message);
        }
      });

    loadSessions();
  }, [router, loadSessions]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await removeSession(pendingDelete);
    setPendingDelete(null);
    // Refresh stats summary after deletion
    dashboard.summary().then((summary) => setStats(summary.data)).catch(() => {});
  };

  const counts = stats?.interviewCounts || {};
  const analytics = stats?.analytics || {};

  if (!stats && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
          <Spinner className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <TopNav username={user?.username} />

      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.username}</span>! Manage your sessions and review skill analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/interview/setup')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Start New Interview
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Interviews Left Today"
            value={stats?.interviewsRemainingToday ?? 5}
            sub="daily limit"
            color="text-rose-600 dark:text-rose-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Completed Interviews"
            value={stats?.completedInterviews ?? 0}
            sub="finished sessions"
            color="text-brand-600 dark:text-brand-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Sessions"
            value={stats?.totalSessions ?? 0}
            sub="all interview types"
            color="text-emerald-600 dark:text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            label="Technical Practice"
            value={counts.technical ?? 0}
            sub="sessions"
            color="text-amber-600 dark:text-amber-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
          />
        </div>

        {/* Secondary Category Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="HR Sessions" value={counts.hr ?? 0} color="text-indigo-600 dark:text-indigo-400" />
          <StatCard label="Resume Sessions" value={counts.resume ?? 0} color="text-purple-600 dark:text-purple-400" />
          <StatCard label="Aptitude Sessions" value={counts.aptitude ?? 0} color="text-teal-600 dark:text-teal-400" />
        </div>

        {/* Continue active session banner if applicable */}
        {stats?.continueSessionId && (
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">You have an active interview session!</h3>
              <p className="text-sm text-brand-100 mt-0.5">Resume where you left off to get full feedback on your performance.</p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push(`/interview/${stats.continueSessionId}`)}
              className="whitespace-nowrap shadow-md"
            >
              Continue Session →
            </Button>
          </div>
        )}

        {/* Manage & Resume Sessions List */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Manage & Continue Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Resume active interviews or delete completed chat sessions.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/history')}
            >
              View All ({sessions.length})
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-8 text-center border-slate-200/80 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No active or past sessions found. Start a new interview to see it listed here!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <SessionCard
                  key={session.id || session.sessionId}
                  session={session}
                  deleting={deletingId === (session.id || session.sessionId)}
                  showDetails
                  onViewDetails={(id) => router.push(`/history/${id}`)}
                  onDelete={(id) => setPendingDelete(id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Embedded Analytics Section */}
        <section className="space-y-4 pt-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Skill Matrix & Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluation rating across your technical, HR, aptitude, and resume sessions.
            </p>
          </div>

          {Object.keys(analytics).length === 0 ||
          Object.values(analytics).every((group) => Object.values(group || {}).every((v) => !v)) ? (
            <Card className="p-8 text-center border-slate-200/80 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Complete your first interview to generate competency analytics charts here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {Object.entries(analytics).map(([type, group]) => (
                <Card key={type} className="p-6 border-slate-200/80 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    {type} Interview Competency
                  </h3>
                  <AnalyticsChart analytics={group} />
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <DeleteDialog
        open={!!pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={!!pendingDelete && deletingId === pendingDelete}
      />
    </div>
  );
}
