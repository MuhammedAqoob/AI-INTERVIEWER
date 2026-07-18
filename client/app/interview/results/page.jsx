'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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
    if (average >= 8) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
    if (average >= 6) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' };
    if (average >= 4) return { label: 'Needs Improvement', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' };
    return { label: 'Keep Practicing', color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200' };
  };

  const grade = getGrade();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Interview Results</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full">
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className={`w-24 h-24 rounded-full ${grade.bg} ring-4 ${grade.ring} flex items-center justify-center mx-auto mb-6`}>
              <span className={`text-3xl font-bold ${grade.color}`}>{average}</span>
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${grade.color}`}>{grade.label}</h2>
            <p className="text-gray-500 text-sm mb-8">Here is a summary of your interview performance</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{score}</p>
                <p className="text-xs text-gray-500">Total Score</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{questions}</p>
                <p className="text-xs text-gray-500">Questions Answered</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{average}</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{Math.round(average * 10)}%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/interview/setup')}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Start New Interview
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
