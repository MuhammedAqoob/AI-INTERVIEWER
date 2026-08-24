'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, dashboard } from '../../lib/api';
import { useSessions } from '../../lib/useSessions';
import { Button, Spinner, Card, Badge, DeleteDialog, CardSkeleton } from '../../components/ui';
import TopNav from '../../components/TopNav';
import { useTheme } from '../../components/ThemeProvider';
import { formatDate, titleCase } from '../../lib/format';

/* ─────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────── */
const Icons = {
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  tech: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  hr: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  aptitude: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  resume: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   Greeting helper
   ───────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─────────────────────────────────────────────
   Competency labels and grouping
   ───────────────────────────────────────────── */
const COMPETENCY_LABELS = {
  technology: 'Technology',
  problemSolving: 'Problem Solving',
  criticalThinking: 'Critical Thinking',
  communication: 'Communication',
  leadership: 'Leadership',
  professionalism: 'Professionalism',
  confidence: 'Confidence',
  logicalReasoning: 'Logical Reasoning',
  accuracy: 'Accuracy',
  speed: 'Speed',
};

const COMPETENCY_GROUPS = {
  TECHNICAL: ['technology', 'problemSolving', 'criticalThinking'],
  HR: ['communication', 'leadership', 'professionalism', 'confidence'],
  APTITUDE: ['logicalReasoning', 'accuracy', 'speed'],
};

const GROUP_COLORS = {
  TECHNICAL: 'brand',
  HR: 'info',
  APTITUDE: 'warning',
};

const TYPE_ICONS = {
  TECHNICAL: Icons.tech,
  HR: Icons.hr,
  APTITUDE: Icons.aptitude,
  RESUME: Icons.resume,
};

/* ─────────────────────────────────────────────
   Progress Bar (reusable, compact)
   ───────────────────────────────────────────── */
function ProgressBar({ value = 0, color = 'brand', className = '' }) {
  const colorMap = {
    brand: 'bg-brand-500 dark:bg-brand-400',
    purple: 'bg-purple-500 dark:bg-purple-400',
    emerald: 'bg-emerald-500 dark:bg-emerald-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    indigo: 'bg-indigo-500 dark:bg-indigo-400',
    teal: 'bg-teal-500 dark:teal-400',
    rose: 'bg-rose-500 dark:rose-400',
  };

  return (
    <div className={`h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap[color] || colorMap.brand}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section Divider
   ───────────────────────────────────────────── */
function Divider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />;
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
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
    dashboard.summary().then((summary) => setStats(summary.data)).catch(() => {});
  };

  /* ─── Derived data ─── */
  const analytics = stats?.analytics || {};
  const counts = stats?.interviewCounts || {};

  const overallScore = useMemo(() => {
    const types = Object.values(analytics);
    if (types.length === 0) return 0;
    const allValues = types.flatMap((group) => Object.values(group || {}));
    const nonZero = allValues.filter((v) => v > 0);
    if (nonZero.length === 0) return 0;
    return Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length);
  }, [analytics]);

  const categoryScores = useMemo(() => {
    const result = {};
    for (const [type, group] of Object.entries(analytics)) {
      const values = Object.values(group || {}).filter((v) => v > 0);
      result[type] = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
    }
    return result;
  }, [analytics]);

  const hasData = stats && stats.completedInterviews > 0;

  const recentSessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt || b.startedAt || 0) - new Date(a.createdAt || a.startedAt || 0))
      .slice(0, 5);
  }, [sessions]);

  /* ─── Loading state ─── */
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

  /* ─── Error state ─── */
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <TopNav username={user?.username} />
        <main className="max-w-6xl mx-auto py-20 px-4 sm:px-6 text-center">
          <Card className="max-w-md mx-auto p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Something went wrong</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-16">
      <TopNav username={user?.username} />

      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">

        {/* ─── 1. Welcome Header ─── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{getGreeting()}, {user?.username} 👋</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Ready for your next interview?
              </h1>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/interview/setup')}
              icon={Icons.plus}
              className="shadow-lg shadow-brand-500/20 shrink-0"
            >
              Start New Interview
            </Button>
          </div>
        </section>

        {/* ─── Active session banner ─── */}
        {stats?.continueSessionId && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 p-5 sm:p-6 text-white shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">You have an active interview session</h3>
                <p className="text-sm text-brand-100 mt-0.5">Resume where you left off to get full feedback on your performance.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/interview/${stats.continueSessionId}`)}
                className="whitespace-nowrap"
              >
                Continue Session →
              </Button>
            </div>
          </div>
        )}

        {/* ─── 2. Top Summary Cards ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interviews Left Today</p>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {Icons.clock}
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {stats?.interviewsRemainingToday ?? 5}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">daily limit</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed Interviews</p>
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                {Icons.check}
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {stats?.completedInterviews ?? 0}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">finished sessions</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Score</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {Icons.chart}
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {hasData ? overallScore : '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">current performance</p>
          </div>
        </section>

        {/* ─── Empty / New user state ─── */}
        {!hasData && (
          <section className="py-8">
            <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                {Icons.lightbulb}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Your performance journey starts here
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Complete your first interview to begin building your performance profile and see detailed analytics.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/interview/setup')}
                  icon={Icons.plus}
                >
                  Start Your First Interview
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* ─── 3. Performance Overview ─── */}
        {hasData && (
          <>
            <Divider />
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Performance Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your aggregated scores across completed interviews.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Overall */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Overall</p>
                  <p className="text-4xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">{overallScore}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">out of 100</p>
                  <ProgressBar value={overallScore} color="brand" className="mt-3" />
                </div>

                {/* Per-category */}
                {['TECHNICAL', 'HR', 'APTITUDE'].map((type) => {
                  const score = categoryScores[type] || 0;
                  const colorMap = { TECHNICAL: 'brand', HR: 'indigo', APTITUDE: 'amber' };
                  return (
                    <div key={type} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-slate-400 dark:text-slate-500">{TYPE_ICONS[type]}</div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{type}</p>
                      </div>
                      <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{score || '—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{score ? 'out of 100' : 'no data yet'}</p>
                      <ProgressBar value={score} color={colorMap[type]} className="mt-3" />
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ─── 4. Competency Performance ─── */}
        {hasData && Object.keys(analytics).length > 0 && (
          <>
            <Divider />
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Competency Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Detailed performance across individual skills.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                {Object.entries(COMPETENCY_GROUPS).map(([type, keys]) => {
                  if (!analytics[type]) return null;
                  const groupData = analytics[type];
                  const colorMap = { TECHNICAL: 'brand', HR: 'indigo', APTITUDE: 'amber' };
                  return (
                    <Card key={type} className="p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="text-slate-400 dark:text-slate-500">{TYPE_ICONS[type]}</div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{type}</h3>
                      </div>
                      <div className="space-y-3">
                        {keys.map((key) => {
                          const val = groupData[key] || 0;
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{COMPETENCY_LABELS[key]}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{val || '—'}</span>
                              </div>
                              <ProgressBar value={val} color={colorMap[type]} />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ─── 5. Interview Activity ─── */}
        {hasData && (
          <>
            <Divider />
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Interview Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total sessions by interview type.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { type: 'TECHNICAL', label: 'Technical', count: counts.technical || 0, color: 'brand' },
                  { type: 'HR', label: 'HR', count: counts.hr || 0, color: 'indigo' },
                  { type: 'APTITUDE', label: 'Aptitude', count: counts.aptitude || 0, color: 'amber' },
                  { type: 'RESUME', label: 'Resume', count: counts.resume || 0, color: 'emerald' },
                ].map((item) => (
                  <div key={item.type} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-slate-400 dark:text-slate-500">{TYPE_ICONS[item.type]}</div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                    </div>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{item.count}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">sessions</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ─── 6. Recent Interviews ─── */}
        {hasData && (
          <>
            <Divider />
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    Recent Interviews
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your latest completed sessions.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
                  View All History
                </Button>
              </div>

              {sessionsLoading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : recentSessions.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No completed interviews yet.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => {
                    const id = session.id || session.sessionId;
                    return (
                      <div
                        key={id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                        onClick={() => router.push(`/history/${id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/history/${id}`); }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-slate-400 dark:text-slate-500 flex-shrink-0">{TYPE_ICONS[session.interviewType]}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={GROUP_COLORS[session.interviewType] || 'default'} className="text-[10px]">
                                {session.interviewType}
                              </Badge>
                              {session.branch && (
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{titleCase(session.branch)}</span>
                              )}
                              {session.difficulty && (
                                <Badge variant={session.difficulty === 'EASY' ? 'success' : session.difficulty === 'MEDIUM' ? 'warning' : 'danger'} className="text-[10px]">
                                  {session.difficulty}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(session.createdAt || session.startedAt)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{session.overallAverage ?? '—'}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">avg score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ─── 7. Practice Recommendations ─── */}
        {hasData && (
          <>
            <Divider />
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Practice Recommendations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Personalized guidance based on your performance.
                </p>
              </div>

              <Recommendations categoryScores={categoryScores} />
            </section>
          </>
        )}
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

/* ═══════════════════════════════════════════════
   Recommendations component
   ═══════════════════════════════════════════════ */
function Recommendations({ categoryScores }) {
  const router = useRouter();
  const tech = categoryScores.TECHNICAL || 0;
  const hr = categoryScores.HR || 0;
  const apt = categoryScores.APTITUDE || 0;

  const items = [];

  // Find strongest and weakest
  const scores = [
    { type: 'TECHNICAL', label: 'Technical', score: tech, route: '/interview/setup' },
    { type: 'HR', label: 'HR', score: hr, route: '/interview/setup' },
    { type: 'APTITUDE', label: 'Aptitude', score: apt, route: '/interview/setup' },
  ];

  const withData = scores.filter((s) => s.score > 0);
  if (withData.length === 0) return null;

  const sorted = [...withData].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  // Weakest
  if (weakest.score < 50) {
    items.push({
      title: `${weakest.label} needs attention`,
      description: `Your ${weakest.label.toLowerCase()} score is ${weakest.score}. Focused practice can help improve this area significantly.`,
      type: 'warning',
    });
  } else if (weakest.score < 70) {
    items.push({
      title: `${weakest.label} still has room to improve`,
      description: `At ${weakest.score}, there's opportunity to strengthen your ${weakest.label.toLowerCase()} performance.`,
      type: 'info',
    });
  }

  // Middle category (if exists)
  if (withData.length >= 3) {
    const middle = sorted[1];
    if (middle.score >= 50 && middle.score < 80) {
      items.push({
        title: `${middle.label} is progressing well`,
        description: `A score of ${middle.score} shows solid fundamentals. A few more sessions could push this higher.`,
        type: 'brand',
      });
    }
  }

  // Strongest
  if (strongest.score >= 70) {
    items.push({
      title: `${strongest.label} is your strongest area`,
      description: `At ${strongest.score}, you're performing well. Keep maintaining this level with occasional practice.`,
      type: 'success',
    });
  }

  // If we have no items yet (all scores similar), add a generic one
  if (items.length === 0) {
    items.push({
      title: 'Keep practicing across all areas',
      description: 'Your scores are balanced. Regular practice across Technical, HR, and Aptitude will help maintain and improve your overall performance.',
      type: 'brand',
    });
  }

  const borderColors = {
    warning: 'border-l-amber-500 dark:border-l-amber-400',
    info: 'border-l-indigo-500 dark:border-l-indigo-400',
    brand: 'border-l-brand-500 dark:border-l-brand-400',
    success: 'border-l-emerald-500 dark:border-l-emerald-400',
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 border-l-4 ${borderColors[item.type]} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/interview/setup')}
            className="shrink-0"
          >
            Practice Now
          </Button>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="secondary" size="sm" onClick={() => router.push('/interview/setup')}>
          Practice Technical
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.push('/interview/setup')}>
          Practice HR
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.push('/interview/setup')}>
          Practice Aptitude
        </Button>
      </div>
    </div>
  );
}
