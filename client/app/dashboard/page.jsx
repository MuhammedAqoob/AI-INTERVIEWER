'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, dashboard, interview } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        auth.me(),
        dashboard.summary(),
      ]);

      setUser(userRes.data.user);
      setStats(statsRes.data);

      try {
        const sessionsRes = await dashboard.activeSessions();
        setActiveSessions(sessionsRes.data || []);
      } catch {
        setActiveSessions([]);
      }
    } catch (err) {
      if (err.message === 'Access denied. No token provided.' || err.message === 'Invalid token.') {
        router.push('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const handleStartInterview = () => {
    router.push('/interview/setup');
  };

  const handleResumeInterview = (sessionId) => {
    router.push(`/interview/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this interview session?')) return;
    try {
      await interview.end(sessionId);
      setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">AI Interviewer</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hello, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Lives Remaining"
            value={stats?.livesRemaining ?? 0}
            sub="Resets daily"
            color="text-rose-600"
          />
          <StatCard
            label="Current Streak"
            value={stats?.currentStreak ?? 0}
            sub="days in a row"
            color="text-amber-600"
          />
          <StatCard
            label="Best Streak"
            value={stats?.bestStreak ?? 0}
            sub="all time"
            color="text-emerald-600"
          />
          <StatCard
            label="Total Interviews"
            value={stats?.totalInterviews ?? 0}
            sub="completed"
            color="text-blue-600"
          />
        </div>

        {activeSessions.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-medium text-gray-500">Active Interviews</h2>
            {activeSessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-blue-900">
                    {session.interviewType}
                    {session.branch && ` — ${session.branch}`}
                  </p>
                  <p className="text-sm text-blue-600">
                    {session.totalQuestions} questions answered • Score: {session.accumulatedScore}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResumeInterview(session.sessionId)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.sessionId)}
                    className="px-5 py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Interview?</h2>
            <p className="text-gray-500 mb-6">
              Practice with AI-powered interviews. Get instant feedback and improve your skills.
            </p>
          </div>

          <button
            onClick={handleStartInterview}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Start New Interview
          </button>

          {!stats?.canStartInterview && (
            <p className="mt-3 text-sm text-gray-400">
              Lives reset tomorrow. Come back then!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
