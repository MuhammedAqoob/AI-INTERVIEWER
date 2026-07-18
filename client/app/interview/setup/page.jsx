'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interview } from '../../../lib/api';

const INTERVIEW_TYPE_ICONS = {
  TECHNICAL: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  HR: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  APTITUDE: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

const BRANCH_ICONS = {
  COMPUTER_SCIENCE: '💻',
  ELECTRONICS: '⚡',
  MECHANICAL: '⚙️',
  CIVIL: '🏗️',
  ELECTRICAL: '🔌',
};

export default function InterviewSetupPage() {
  const router = useRouter();
  const [options, setOptions] = useState({ branches: [], interviewTypes: [] });
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await interview.options();
      setOptions(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedType) return;

    const requiresBranch = options.interviewTypes.find(
      (t) => t.value === selectedType
    )?.requiresBranch;

    if (requiresBranch && !selectedBranch) return;

    setStarting(true);
    setError('');

    try {
      const res = await interview.start(selectedType, selectedBranch);
      router.push(`/interview/${res.data.sessionId}`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading options...</div>
      </div>
    );
  }

  const selectedTypeInfo = options.interviewTypes.find((t) => t.value === selectedType);
  const showBranchSelection = selectedTypeInfo?.requiresBranch;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Interview</h1>
            <div className="w-20" />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-10 px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Interview Type</h2>
          <p className="text-sm text-gray-500 mb-4">Choose the kind of interview you want to practice</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {options.interviewTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  setSelectedBranch(null);
                }}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  selectedType === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`mb-3 ${selectedType === type.value ? 'text-blue-600' : 'text-gray-400'}`}>
                  {INTERVIEW_TYPE_ICONS[type.value]}
                </div>
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {type.requiresBranch ? 'Requires branch selection' : 'No branch needed'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {showBranchSelection && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Branch</h2>
            <p className="text-sm text-gray-500 mb-4">Choose your engineering branch</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {options.branches.map((branch) => (
                <button
                  key={branch.value}
                  onClick={() => setSelectedBranch(branch.value)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    selectedBranch === branch.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2">{BRANCH_ICONS[branch.value]}</div>
                  <div className="font-medium text-gray-900">{branch.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleStart}
            disabled={!selectedType || (showBranchSelection && !selectedBranch) || starting}
            className="px-10 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {starting ? 'Starting...' : 'Begin Interview'}
          </button>
        </div>
      </main>
    </div>
  );
}
