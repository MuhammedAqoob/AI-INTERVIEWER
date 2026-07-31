'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '../components/TopNav';
import { Button, Card } from '../components/ui';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleTakeInterview = () => {
    if (user) {
      router.push('/interview/setup');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col justify-between">
      <div>
        {/* Glass Navigation Bar */}
        <TopNav username={user?.username} />

        {/* Hero Section */}
        <section className="max-w-5xl mx-auto py-16 sm:py-24 px-4 sm:px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            AI-Powered Interview Practice
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Master Technical Interviews with{' '}
            <span className="text-brand-600 dark:text-brand-400">Real-Time AI Feedback</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Practice domain-specific questions in Computer Science, Electronics, Mechanical, or upload your resume for tailored AI evaluation and scoring.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleTakeInterview}
              className="px-8 py-3.5 text-base shadow-lg shadow-brand-500/20"
            >
              Take Interview →
            </Button>

            {user ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3.5 text-base"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/register')}
                className="px-8 py-3.5 text-base"
              >
                Sign Up Free
              </Button>
            )}
          </div>
        </section>

        {/* What It Does Section */}
        <section className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              What It Does
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Everything you need to improve your interview performance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Adaptive AI Questions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Generates dynamic follow-up questions tailored to your answer depth, technical domain, and chosen branch.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                📄
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Resume PDF & Image Upload
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload your resume to extract your specific technologies, work history, and projects for customized mock questions.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                📊
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                10-Point Skill Matrix
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluates technical depth, problem-solving, confidence, grammar, relevance, and professionalism on every turn.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                💡
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Instant "Better Answer" Feedback
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Review suggested model answers after every turn to quickly learn optimal phrasing, key terminology, and depth.
              </p>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              How It Works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Three simple steps to start practicing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full border border-brand-200/60 dark:border-brand-800/60">
                Step 1
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Setup Interview
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Select Technical, HR, Aptitude, or Resume track, pick your branch, and choose question limit.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                Step 2
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Answer AI Questions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Respond to AI-generated questions in real-time as difficulty adapts to your responses.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                Step 3
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Review & Improve
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Check overall scores, suggested better answers, competency charts, and leaderboard standing.
              </p>
            </div>
          </div>

        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-8 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <div className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-[10px] font-black">
              AI
            </div>
            <span>AI Interviewer</span>
          </div>
          <p>© {new Date().getFullYear()} AI Interviewer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
