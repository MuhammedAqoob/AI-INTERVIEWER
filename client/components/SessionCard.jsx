'use client';

import { useRouter } from 'next/navigation';
import { DifficultyBadge, TypeBadge, Button } from './ui';
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <TypeBadge type={session.interviewType} />
          {session.branch && (
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {titleCase(session.branch)}
            </span>
          )}
          {session.difficulty && <DifficultyBadge difficulty={session.difficulty} />}
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            Avg Score: {session.overallAverage ?? 0}
          </span>
          {typeof session.turnCount === 'number' && ` • ${session.turnCount} answered`}
          {typeof session.analyticsSamples === 'number' &&
            session.analyticsSamples > 0 &&
            ` • ${session.analyticsSamples} evaluated`}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Created {formatDate(session.createdAt || session.startedAt)}
          {session.updatedAt ? ` • Updated ${formatDateTime(session.updatedAt)}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canResume && (
          <Button variant="primary" size="sm" onClick={resume}>
            Resume
          </Button>
        )}
        {showDetails && onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(id)}>
            Details
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          loading={deleting}
          onClick={() => onDelete?.(id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
