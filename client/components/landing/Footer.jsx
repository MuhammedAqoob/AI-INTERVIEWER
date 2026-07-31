'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo & Status */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-black">
                AI
              </div>
              <span>AI Interviewer</span>
            </Link>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
              Workflow
            </a>
            <a href="#analytics" className="hover:text-slate-200 transition-colors">
              Analytics
            </a>
            <a href="#faq" className="hover:text-slate-200 transition-colors">
              FAQ
            </a>
            <Link href="/login" className="hover:text-slate-200 transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} AI Interviewer Inc. All rights reserved.</p>
          <p>Powered by Next.js 14, Tailwind CSS & AI Evaluation Engine.</p>
        </div>
      </div>
    </footer>
  );
}
