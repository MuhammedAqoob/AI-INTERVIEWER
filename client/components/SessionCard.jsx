'use client';

import { useRouter } from 'next/navigation';
import { DifficultyBadge, TypeBadge, Spinner } from './ui';
import { formatDate, formatDateTime, titleCase } from '../lib/format';

export default function SessionCard({
  session,
  onDelete,
  onViewDetails,
  deleting = false,
  showDetails = false,
}) {
  const router = useRouter();
  const id = session.id || session.sessionId;
  const canResume = session.status === 'ACTIVE' || session.status === 'PAUSED';
  const resume = () => router.push(`/interview/${id}`);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <TypeBadge type={session.interviewType} />
          {session.branch && (
            <span className="text-sm font-semibold text-gray-900">
              {titleCase(session.branch)}
            </span>
          )}
          {session.difficulty && <DifficultyBadge difficulty={session.difficulty} />}
        </div>
        <p className="text-sm text-gray-500">
          Avg: {session.overallAverage ?? 0}
          {typeof session.turnCount === 'number' && ` • ${session.turnCount} answered`}
          {typeof session.analyticsSamples === 'number' &&
            session.analyticsSamples > 0 &&
            ` • ${session.analyticsSamples} evaluated`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Created {formatDate(session.createdAt || session.startedAt)}
          {session.updatedAt ? ` • Updated ${formatDateTime(session.updatedAt)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canResume && (
          <button
            onClick={resume}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Resume
          </button>
        )}
        {showDetails && onViewDetails && (
          <button
            onClick={() => onViewDetails(id)}
            className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        )}
        <button
          onClick={() => onDelete?.(id)}
          disabled={deleting}
          className="px-5 py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting && <Spinner className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  );
}
