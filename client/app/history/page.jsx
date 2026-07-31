'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessions } from '../../lib/useSessions';
import { DeleteDialog, CardSkeleton, Button, Card } from '../../components/ui';
import TopNav from '../../components/TopNav';
import SessionCard from '../../components/SessionCard';

export default function HistoryPage() {
  const router = useRouter();
  const { sessions, loading, error, deletingId, load, remove } = useSessions();
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-12">
      <TopNav />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Interview History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review your past interview responses, feedback, and suggested answers.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/interview/setup')}
          >
            New Interview
          </Button>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center border-slate-200/80 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              No interview history yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Complete an interview session to see detailed evaluations listed here.
            </p>
            <Button variant="primary" onClick={() => router.push('/interview/setup')}>
              Start an Interview
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Your Sessions ({sessions.length})
            </h2>
            <div className="space-y-3">
              {sessions.map((session) => (
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
          </div>
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
