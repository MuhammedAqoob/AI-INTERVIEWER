'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interview } from '../../lib/api';
import { useSessions } from '../../lib/useSessions';
import { DeleteDialog, CardSkeleton } from '../../components/ui';
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
    const ok = await remove(pendingDelete);
    setPendingDelete(null);
    if (!ok) {
      // keep dialog state; error shown in page
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="max-w-4xl mx-auto py-10 px-4">
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No interview history yet.</h2>
            <p className="text-sm text-gray-500 mb-6">
              Complete an interview to see it listed here.
            </p>
            <button
              onClick={() => router.push('/interview/setup')}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start an Interview
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Your Interviews ({sessions.length})
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
