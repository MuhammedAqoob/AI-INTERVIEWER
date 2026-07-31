'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Spinner } from '../../../components/ui';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get('score') || '0', 10);
  const questions = parseInt(searchParams.get('questions') || '0', 10);
  const average = questions > 0 ? (score / questions).toFixed(1) : '0.0';

  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const getGrade = () => {
    if (average >= 8)
      return {
        label: 'Excellent',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        ring: 'ring-emerald-200 dark:ring-emerald-800',
      };
    if (average >= 6)
      return {
        label: 'Good',
        color: 'text-brand-600 dark:text-brand-400',
        bg: 'bg-brand-50 dark:bg-brand-950/60',
        ring: 'ring-brand-200 dark:ring-brand-800',
      };
    if (average >= 4)
      return {
        label: 'Needs Improvement',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        ring: 'ring-amber-200 dark:ring-amber-800',
      };
    return {
      label: 'Keep Practicing',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      ring: 'ring-rose-200 dark:ring-rose-800',
    };
  };

  const grade = getGrade();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Results</h1>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full">
          <Card
            className={`p-8 text-center transition-all duration-500 shadow-xl border-slate-200/80 dark:border-slate-800 ${
              animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Score Ring */}
            <div
              className={`w-24 h-24 rounded-full ${grade.bg} ring-4 ${grade.ring} flex items-center justify-center mx-auto mb-6 shadow-inner`}
            >
              <span className={`text-3xl font-extrabold ${grade.color}`}>{average}</span>
            </div>

            <h2 className={`text-2xl font-extrabold mb-1 tracking-tight ${grade.color}`}>
              {grade.label}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              Here is a summary of your interview performance
            </p>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3.5">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{score}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Score</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3.5">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{questions}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Questions Answered</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3.5">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{average}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Score</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3.5">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {Math.round(average * 10)}%
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Accuracy Rate</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/interview/setup')}
                className="w-full"
              >
                Start New Interview
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
          <Spinner className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
