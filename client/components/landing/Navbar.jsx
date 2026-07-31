'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

export default function Navbar({ user }) {
  const router = useRouter();
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'Resume AI', href: '#resume-ai' },
    { label: 'Leaderboard', href: '#leaderboard' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-200">
              AI
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
                AI Interviewer
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
                  2.0
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-4 py-1.5 rounded-full shadow-inner">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-all"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {user ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-white rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Sign In
                </Link>

                <button
                  onClick={() => router.push('/register')}
                  className="relative group inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold text-white rounded-xl bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600 group-hover:from-brand-500 group-hover:to-purple-600 shadow-md shadow-brand-500/20 active:scale-[0.98] transition-all"
                >
                  <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-slate-950 dark:bg-slate-950 rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    Start Free Interview
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 rounded-lg hover:bg-slate-900"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-300 hover:bg-slate-900 rounded-xl"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-3"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-900 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-900 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 text-xs font-bold text-slate-900 bg-slate-100 rounded-xl text-center"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full py-2.5 text-xs font-semibold text-slate-300 bg-slate-900 rounded-xl text-center"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl text-center"
                  >
                    Start Free Interview
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
