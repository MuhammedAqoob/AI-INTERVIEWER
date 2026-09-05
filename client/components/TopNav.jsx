'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '../lib/api';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { status, user, markGuest, refresh } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Boolean state only flips on threshold crossings, so no re-render churn.
    const onScroll = () => {
      const next = window.scrollY > 16;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth state is shared via AuthProvider: only an explicit 401 (or logout)
  // yields 'guest'. While 'pending'/'unavailable' the navbar stays neutral so a
  // waking Render backend never flashes a false "Login / Sign Up".
  const isAuthenticated = status === 'authenticated';
  const effectiveUsername = isAuthenticated ? user?.username : null;

  const handleLogout = async () => {
    try {
      await auth.logout();
      // Hard navigation to a clean guest home: the fresh load re-checks the
      // session (now cookie-less → 401 → guest). This also guarantees no
      // mounted protected page can race a guest-guard redirect to /login, and
      // replace() keeps Back from returning to the now-guarded page.
      window.location.replace('/');
      return;
    } catch (e) {
      // Backend unreachable: the cookie couldn't be cleared server-side, so
      // fall back to a local session drop (best effort) instead of reloading
      // straight back into an authenticated session.
    }
    markGuest();
    router.replace('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 dark:bg-slate-950/85 border-slate-200/70 dark:border-slate-800/70 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.22)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.65)]'
          : 'bg-white/45 dark:bg-slate-950/45 border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-[4.25rem] items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 lg:gap-3 text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg group fx-enter-down"
            style={{ '--fd': '0.02s' }}
          >
            <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white font-black text-sm lg:text-[15px] shadow-md shadow-brand-500/20 transition-transform duration-300 ${
              scrolled ? 'scale-95' : 'scale-100 group-hover:scale-105'
            }`}>
              AI
            </div>
            <span className="tracking-tight font-extrabold">AI Interviewer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-slate-100/70 dark:bg-slate-900/60 backdrop-blur-md px-3 lg:px-3.5 py-1 lg:py-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/80 fx-enter-down" style={{ '--fd': '0.12s' }}>
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-[13px] font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    active
                      ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:-translate-y-0.5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3 fx-enter-down" style={{ '--fd': '0.22s' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className="p-2 lg:p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 lg:gap-3">
                <span className="hidden sm:inline-flex items-center max-w-[11rem] truncate text-xs lg:text-[13px] font-semibold px-2.5 lg:px-3 py-1 lg:py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700">
                  {effectiveUsername}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-[13px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 active:bg-rose-200/70 dark:bg-rose-950/50 dark:hover:bg-rose-950 border border-rose-200/80 dark:border-rose-900/70 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : status === 'guest' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 lg:px-5 py-1.5 lg:py-2 text-xs lg:text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 rounded-xl shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              /* AUTH UNKNOWN: neutral, never a false "Login / Sign Up" */
              <div aria-live="polite" className="flex items-center gap-2">
                {status === 'unavailable' ? (
                  <button
                    type="button"
                    onClick={refresh}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Offline · Retry
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                    Checking session…
                  </span>
                )}
                <span aria-hidden="true" className="sm:hidden w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 lg:p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 fx-enter-down" style={{ '--fd': '0.02s' }}>
            {effectiveUsername && (
              <div className="px-3.5 py-1 text-xs text-slate-500 dark:text-slate-400">
                Signed in as <span className="font-semibold text-slate-900 dark:text-slate-100">{effectiveUsername}</span>
              </div>
            )}
            {!isAuthenticated && status !== 'guest' && (
              <div className="px-3.5 py-1 text-xs text-slate-400 dark:text-slate-500">
                {status === 'unavailable' ? (
                  <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Offline · Retry
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                    Checking session…
                  </span>
                )}
              </div>
            )}
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {status === 'guest' ? (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-bold text-white bg-brand-600 rounded-xl"
                >
                  Sign Up
                </Link>
              </div>
            ) : isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                Logout
              </button>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
}
