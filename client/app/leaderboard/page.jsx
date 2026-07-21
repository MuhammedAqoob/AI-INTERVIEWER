'use client';

import { useEffect, useState } from 'react';
import { leaderboard, auth } from '../../lib/api';
import { Spinner } from '../../components/ui';
import TopNav from '../../components/TopNav';

const MEDALS = {
  1: { emoji: '🥇', ring: 'ring-yellow-300 bg-yellow-50', label: 'text-yellow-700' },
  2: { emoji: '🥈', ring: 'ring-gray-300 bg-gray-50', label: 'text-gray-600' },
  3: { emoji: '🥉', ring: 'ring-amber-300 bg-amber-50', label: 'text-amber-700' },
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [lbRes, meRes] = await Promise.all([
        leaderboard.list(50),
        auth.me().catch(() => null),
      ]);
      setRows(lbRes.data || []);
      setCurrentUser(meRes?.data?.user?.username || null);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav username={currentUser || undefined} />

      <main className="max-w-4xl mx-auto py-10 px-4">
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Spinner className="w-8 h-8 text-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No leaderboard entries yet.</h2>
            <p className="text-sm text-gray-500">
              Complete any core interview to join. Every core criterion has equal weight; missing criteria count as zero.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const isCurrent = currentUser && row.username === currentUser;
              const medal = MEDALS[row.rank];
              return (
                <div
                  key={row.username}
                  className={`bg-white border rounded-2xl p-5 flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'border-blue-400 ring-2 ring-blue-200'
                      : medal
                      ? `${medal.ring} border-transparent`
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold flex-shrink-0 ${
                        medal ? 'bg-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {medal ? medal.emoji : row.rank}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          isCurrent ? 'text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {row.username}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{row.criteriaCovered}/10 core criteria demonstrated · Resume can only boost existing scores.</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-bold ${medal ? medal.label : 'text-gray-900'}`}>
                      {row.averageScore}
                    </p>
                    <p className="text-xs text-gray-400">avg score</p>
                    <p className="mt-1 text-[10px] text-gray-400">T {row.categoryScores?.TECHNICAL} · H {row.categoryScores?.HR} · A {row.categoryScores?.APTITUDE}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
