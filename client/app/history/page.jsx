'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessions } from '../../lib/useSessions';
import { DeleteDialog, Button, Card, Badge, Spinner } from '../../components/ui';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../components/AuthProvider';
import { formatDate, titleCase } from '../../lib/format';

/* ─────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────── */
const Icons = {
  plus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  tech: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  hr: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  aptitude: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  resume: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  trash: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   Type icon map
   ───────────────────────────────────────────── */
const TYPE_ICONS = {
  TECHNICAL: Icons.tech,
  HR: Icons.hr,
  APTITUDE: Icons.aptitude,
  RESUME: Icons.resume,
};

const STATUS_CONFIG = {
  COMPLETED: { label: 'Completed', variant: 'success', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  ACTIVE: { label: 'In Progress', variant: 'brand', bg: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-700 dark:text-brand-300', ring: 'ring-brand-200 dark:ring-brand-800' },
  PAUSED: { label: 'Paused', variant: 'warning', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-800' },
};

/* ─────────────────────────────────────────────
   Loading skeletons — shaped to the geometry of the
   summary stat cards and the session cards they replace.
   ───────────────────────────────────────────── */
function StatSkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm space-y-2.5" aria-hidden="true">
      <div className="h-2.5 w-14 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-7 w-10 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-2.5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4" aria-hidden="true">
      {/* Top row: type icon + badges (left), score (right) */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="text-right flex-shrink-0 space-y-1.5">
          <div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
          <div className="h-2.5 w-14 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
        </div>
      </div>
      {/* Middle: meta chips (answers / evaluated / date) */}
      <div className="flex items-center gap-4">
        <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      {/* Actions row */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-8 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse ml-auto" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   History Session Card
   ───────────────────────────────────────────── */
function HistorySessionCard({ session, onDelete, onViewDetails, onRetake, deleting }) {
  const router = useRouter();
  const id = session.id || session.sessionId;
  const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.COMPLETED;
  const canResume = session.status === 'ACTIVE' || session.status === 'PAUSED';
  const isCompleted = session.status === 'COMPLETED';
  // Retake only for incomplete (ACTIVE/PAUSED) non-Resume sessions
  const canRetake = !isCompleted && session.interviewType !== 'RESUME';
  const hasScore = session.overallAverage != null && session.overallAverage > 0;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${isCompleted ? '' : 'ring-1 ' + status.ring}`}>
      <div className="p-5">
        {/* Top row: badges + score */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type icon + badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500">{TYPE_ICONS[session.interviewType]}</span>
              <Badge variant={session.interviewType === 'TECHNICAL' ? 'brand' : session.interviewType === 'HR' ? 'info' : session.interviewType === 'APTITUDE' ? 'warning' : 'success'} className="text-[10px]">
                {session.interviewType}
              </Badge>
            </div>
            {session.branch && (
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {titleCase(session.branch)}
              </span>
            )}
            {session.difficulty && (
              <Badge variant={session.difficulty === 'EASY' ? 'success' : session.difficulty === 'MEDIUM' ? 'warning' : 'danger'} className="text-[10px]">
                {session.difficulty}
              </Badge>
            )}
            {/* Status badge */}
            <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
          </div>

          {/* Score */}
          {hasScore && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">{session.overallAverage}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">avg score</p>
            </div>
          )}
        </div>

        {/* Middle: details */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
          {typeof session.turnCount === 'number' && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {session.turnCount} answered
            </span>
          )}
          {typeof session.analyticsSamples === 'number' && session.analyticsSamples > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
              {session.analyticsSamples} evaluated
            </span>
          )}
          <span className="flex items-center gap-1">
            {Icons.clock}
            {formatDate(session.createdAt || session.startedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canResume && (
            <Button variant="primary" size="sm" onClick={() => router.push(`/interview/${id}`)}>
              Resume
            </Button>
          )}
          {isCompleted && (
            <Button variant="outline" size="sm" onClick={() => onViewDetails(id)}>
              Details
            </Button>
          )}
          {canRetake && (
            <Button variant="secondary" size="sm" onClick={() => onRetake(id)}>
              Retake
            </Button>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              loading={deleting}
              onClick={() => onDelete(id)}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            >
              {Icons.trash}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN HISTORY PAGE
   ═══════════════════════════════════════════════ */
export default function HistoryPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { sessions, loading, error, errorStatus, deletingId, load, remove } = useSessions();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const loadedRef = useRef(false);
  const prevStatusRef = useRef(status);

  // Guests never hit the (protected) history endpoint — they get a friendly
  // login-required state instead of the backend's raw 401 message.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (status === 'guest') {
      setAuthRequired(true);
      return;
    }
    if (status === 'pending') return; // let the shared auth check finish
    // A guest→authenticated transition (login completing while this page is
    // mounted) clears a stale auth-required flag. A mid-session 401 keeps it:
    // that flag comes from errorStatus while status stays 'authenticated', and
    // the previous status is not 'guest', so it is preserved here.
    if (prev === 'guest' && authRequired) setAuthRequired(false);
    // authenticated (or unknown-but-reachable): try loading the list once
    if (!loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, [status, load, authRequired]);

  // A 401 on an in-page fetch (e.g. the session expired while browsing) also
  // resolves to the friendly login-required state.
  useEffect(() => {
    if (errorStatus === 401) setAuthRequired(true);
  }, [errorStatus]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete);
    setPendingDelete(null);
  };

  const handleRetake = async (sessionId) => {
    try {
      const { interview } = await import('../../lib/api');
      const res = await interview.retake(sessionId);
      router.push(`/interview/${res.data.sessionId}`);
    } catch {
      // Stay on history page if retake fails
    }
  };

  /* ─── Summary stats (from existing session data, no backend change) ─── */
  const summary = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
    const inProgress = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'PAUSED').length;
    const scored = sessions.filter((s) => s.status === 'COMPLETED' && s.overallAverage != null && s.overallAverage > 0);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + s.overallAverage, 0) / scored.length * 100) / 100 : 0;
    return { total, completed, inProgress, avgScore, hasData: total > 0 };
  }, [sessions]);

  /* ─── Sorted: recent first, with show-all toggle ─── */
  const [showAll, setShowAll] = useState(false);
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.createdAt || b.startedAt || 0) - new Date(a.createdAt || a.startedAt || 0));
  }, [sessions]);
  const visibleSessions = showAll ? sortedSessions : sortedSessions.slice(0, 10);
  const hiddenCount = sortedSessions.length - 10;

  // Data skeletons/content are only meaningful once the shared auth check proves
  // the user is authenticated. Guests get the login card directly; while the
  // check is still pending we show a small neutral state instead of protected-
  // data skeletons (which would otherwise flash — and linger — for visitors).
  const isGuest = status === 'guest' || authRequired;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      <TopNav />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">

        {/* ─── 1. Page Header ─── */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Interview History
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
              Review your previous interviews, track your progress, and revisit your AI feedback.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/interview/setup')}
            className="shrink-0 shadow-lg shadow-brand-500/20"
          >
            New Interview
            <span className="ml-0.5">{Icons.arrow}</span>
          </Button>
        </section>

        {/* ─── Error banner (non-auth, only when a session list is still shown) ─── */}
        {error && !authRequired && summary.hasData && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-center justify-between gap-3">
            <span>Something went wrong while refreshing your history.</span>
            <Button variant="outline" size="sm" onClick={() => load()}>Retry</Button>
          </div>
        )}

        {/* ─── 2. Summary Stats (data-driven: only after auth proves authenticated) ─── */}
        {isGuest || status === 'pending' ? null : loading ? (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading your stats">
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
          </section>
        ) : summary.hasData && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{summary.total}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">sessions</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
                <span className="text-emerald-500 dark:text-emerald-400">{Icons.check}</span>
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{summary.completed}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">finished</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</p>
                <span className="text-brand-500 dark:text-brand-400">{Icons.clock}</span>
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">{summary.inProgress}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">active / paused</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Avg Score</p>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{summary.avgScore || '—'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">completed sessions</p>
            </div>
          </section>
        )}

        {/* ─── 3. Session List ─── */}
        {isGuest ? (
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/40 rounded-2xl flex items-center justify-center mx-auto text-brand-500 dark:text-brand-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Log in to view your interview history
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your sessions and scores are private. Sign in to review past interviews, retake one, or continue where you left off.
            </p>
            <div className="pt-2 flex flex-col items-center gap-3">
              <Button variant="primary" size="lg" onClick={() => router.push('/login')} className="w-full sm:w-auto">
                Log In
              </Button>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                New here?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </Card>
        ) : status === 'pending' ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3" aria-busy="true" aria-label="Checking your session">
            <Spinner className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Checking your session…</p>
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading your history">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error && !authRequired ? (
          /* ─── Friendly error (no raw backend messages) ─── */
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Couldn't load your history
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Something went wrong while fetching your sessions. Check your connection and try again.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="lg" onClick={() => load()}>Try Again</Button>
            </div>
          </Card>
        ) : !summary.hasData ? (
          /* ─── Empty State ─── */
          <Card className="max-w-lg mx-auto p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/40 rounded-2xl flex items-center justify-center mx-auto text-brand-500 dark:text-brand-400">
              {Icons.lightbulb}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              No interviews yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your completed interviews and practice sessions will appear here. Start your first interview to begin tracking your progress.
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
        ) : (
          <>
            <div className="space-y-3">
              {visibleSessions.map((session) => (
                <HistorySessionCard
                  key={session.id || session.sessionId}
                  session={session}
                  deleting={deletingId === (session.id || session.sessionId)}
                  onViewDetails={(id) => router.push(`/history/${id}`)}
                  onDelete={(id) => setPendingDelete(id)}
                  onRetake={handleRetake}
                />
              ))}
            </div>

            {!showAll && hiddenCount > 0 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(true)}
                >
                  Show {hiddenCount} more session{hiddenCount !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
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
