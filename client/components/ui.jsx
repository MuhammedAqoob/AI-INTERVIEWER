'use client';

export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function StatCard({ label, value, sub, color = 'text-blue-600' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

const DIFFICULTY_COLORS = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
};

export function DifficultyBadge({ difficulty }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
        DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.EASY
      }`}
    >
      {difficulty || 'EASY'}
    </span>
  );
}

const TYPE_COLORS = {
  TECHNICAL: 'bg-blue-100 text-blue-700',
  HR: 'bg-teal-100 text-teal-700',
  APTITUDE: 'bg-indigo-100 text-indigo-700',
  RESUME: 'bg-purple-100 text-purple-700',
};

export function TypeBadge({ type }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
        TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {type || '—'}
    </span>
  );
}

export function DeleteDialog({ open, onCancel, onConfirm, loading, title = 'Delete session?' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2 w-2/3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const ANALYTICS_LABELS = {
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

export function analyticsLabel(key) {
  return ANALYTICS_LABELS[key] || key;
}

export function AnalyticsGrid({ analytics }) {
  if (!analytics || typeof analytics !== 'object') {
    return (
      <p className="text-sm text-gray-400">No analytics available yet.</p>
    );
  }

  const entries = Object.entries(analytics);
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400">No analytics available yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(([key, value]) => {
        const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0) * 10));
        return (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {analyticsLabel(key)}
              </span>
              <span className="text-sm font-semibold text-gray-900">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
