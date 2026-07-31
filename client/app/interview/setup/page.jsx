'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Button, Card, Spinner } from '../../../components/ui';

const INTERVIEW_TYPE_ICONS = {
  TECHNICAL: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  HR: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  APTITUDE: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  RESUME: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function InterviewSetupPage() {
  const router = useRouter();
  const [options, setOptions] = useState({ branches: [], interviewTypes: [] });
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [questionLimit, setQuestionLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await interview.options();
      const rawTypes = res.data?.interviewTypes || [];
      const order = ['RESUME', 'TECHNICAL', 'HR', 'APTITUDE'];
      const sortedTypes = [...rawTypes].sort((a, b) => {
        const indexA = order.indexOf(a.value);
        const indexB = order.indexOf(b.value);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      setOptions({ ...res.data, interviewTypes: sortedTypes });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.');
      e.target.value = '';
      return;
    }

    setResumeFile(file);
  };

  const handleStart = async () => {
    if (!selectedType) return;

    const requiresBranch = options.interviewTypes.find(
      (t) => t.value === selectedType
    )?.requiresBranch;

    if (requiresBranch && !selectedBranch) return;

    if (selectedType === 'RESUME' && !resumeFile) {
      setError('Please upload your resume (PDF or image).');
      return;
    }

    setStarting(true);
    setError('');

    try {
      let res;
      if (selectedType === 'RESUME') {
        res = await interview.startResume(resumeFile, questionLimit);
      } else {
        res = await interview.start(selectedType, selectedBranch, questionLimit);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
          <Spinner className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span>Loading interview options...</span>
        </div>
      </div>
    );
  }

  const selectedTypeInfo = options.interviewTypes.find((t) => t.value === selectedType);
  const showBranchSelection = selectedTypeInfo?.requiresBranch;
  const showResumeUpload = selectedType === 'RESUME';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      {/* Header Bar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          >
            Dashboard
          </Button>

          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Interview Setup
          </h1>

          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-2.5"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Type */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              1. Select Interview Type
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the category of questions you want to practice
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {options.interviewTypes.map((type) => {
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.value);
                    setSelectedBranch(null);
                    setResumeFile(null);
                    setError('');
                  }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isSelected
                      ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 shadow-glow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`mb-3 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {INTERVIEW_TYPE_ICONS[type.value]}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {type.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {type.value === 'RESUME'
                      ? 'Upload resume to analyze'
                      : type.requiresBranch
                      ? 'Select branch next'
                      : 'No branch required'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Select Branch (If Required) */}
        {showBranchSelection && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                2. Select Engineering Branch
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose your field of specialization
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {options.branches.map((branch) => {
                const isSelected = selectedBranch === branch.value;
                return (
                  <button
                    key={branch.value}
                    type="button"
                    onClick={() => setSelectedBranch(branch.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isSelected
                        ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 shadow-glow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{BRANCH_ICONS[branch.value] || '⚙️'}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {branch.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 2: Upload Resume (If Selected) */}
        {showResumeUpload && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                2. Upload Resume File
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                PDF, JPEG, or PNG format up to 5MB
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-white dark:bg-slate-900 hover:border-brand-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('resume-upload')?.click();
                  }
                }}
              >
                {resumeFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{resumeFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <span className="inline-block text-xs font-semibold text-brand-600 dark:text-brand-400 underline mt-2">
                      Click to replace file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Click or drag file to upload</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Supports PDF, JPG, PNG (max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </section>
        )}

        {/* Step 3: Question Limit */}
        {selectedType && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                3. Number of Questions
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose total length of your practice session
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 20].map((value) => {
                const isSelected = questionLimit === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuestionLimit(value)}
                    className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {value} Questions
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Submit Action */}
        <div className="flex justify-center pt-6">
          <Button
            variant="primary"
            size="lg"
            loading={starting}
            disabled={
              !selectedType ||
              (showBranchSelection && !selectedBranch) ||
              (showResumeUpload && !resumeFile)
            }
            onClick={handleStart}
            className="w-full sm:w-auto min-w-[240px]"
          >
            Begin Interview
          </Button>
        </div>
      </main>
    </div>
  );
}
