'use client';
// v1.0.1 — production deployment

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '../components/TopNav';
import Reveal, { useInViewPlay } from '../components/motion';
import { Button, Card, Badge } from '../components/ui';
import { auth } from '../lib/api';

/* ─────────────────────────────────────────────
   SVG Icons (inline, minimal, consistent)
   ───────────────────────────────────────────── */
const Icons = {
  brain: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.341 4.023a2.25 2.25 0 01-2.134 1.477H8.475a2.25 2.25 0 01-2.134-1.477L5 14.5m14 0H5" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  sparkle: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
    </svg>
  ),
  tech: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  hr: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  aptitude: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  resume: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   Section Divider
   ───────────────────────────────────────────── */
function SectionDivider() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero Product Mockup
   ───────────────────────────────────────────── */
// Static demo copy (unchanged from the original mockup) — typed word by word.
const DEMO_QUESTION =
  'Explain the difference between TCP and UDP. When would you choose one over the other?';
const DEMO_ANSWER =
  "TCP is connection-oriented and ensures reliable delivery with ordering, while UDP is connectionless and faster but doesn't guarantee delivery...";

function HeroMockup({ mode = 'load' }) {
  const gated = mode === 'inview';
  const { ref: gateRef, className: gateState, playing } = useInViewPlay({ enabled: gated });

  // ─── Cinematic looping demo timeline ───
  // One staged sequence for both placements; only the trigger differs:
  //  - mode="load"   (desktop hero, above the fold) → pure CSS at first paint
  //  - mode="inview" (mobile, below the fold)       → plays when scrolled into view
  // Every reveal — question/answer words, the evaluation strip, the score — is
  // timed by CSS on the SAME stylesheet timeline, so the pieces can never drift
  // apart (no JS timers gate any of them). The only JS timer restarts the demo
  // each 9s by re-mounting the message area (key={cycle}).
  // Reduced motion: no timers run and the CSS animations are disabled, so the
  // static final state stays visible immediately.
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (gated && !playing) return; // wait until the card actually enters the viewport
    const t = setTimeout(() => setCycle((c) => c + 1), 9000); // replay the demo
    return () => clearTimeout(t);
  }, [cycle, gated, playing]);

  // `c(loadClass, gateClass)` picks the animation classes for the current mode.
  const c = (loadClass, gateClass) => (gated ? gateClass : loadClass);
  const fd = (s) => ({ '--fd': s });

  // Word-by-word "typing" reveal: each word fades in on a tight stagger.
  // `start` = when the first word appears; `gap` = seconds between words.
  const typed = (text, start, gap) => {
    const words = text.split(' ');
    return words.map((word, i) => (
      <Fragment key={i}>
        <span
          className={c('fx-word', 'demo-child demo-child-word')}
          style={{ '--wd': `${(start + i * gap).toFixed(3)}s` }}
        >
          {word}
        </span>
        {i < words.length - 1 ? ' ' : ''}
      </Fragment>
    ));
  };

  return (
    <div
      ref={gateRef}
      className={`relative mx-auto max-w-lg w-full ${gated ? `demo-gated-root ${gateState}` : 'fx-enter-zoom'}`}
      style={gated ? undefined : fd('0.06s')}
    >
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-transparent rounded-3xl blur-2xl dark:from-brand-500/10 dark:via-brand-400/5" />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Mockup header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">AI</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Interviewer</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="brand" className="text-[10px]">Technical</Badge>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Question 3 of 5</span>
          </div>
        </div>

        {/* Mockup messages — keyed by cycle so the whole demo replays on loop */}
        <div key={cycle} className="p-5">
          {/* AI question — card materializes quickly, then its text types in word by word */}
          <div className={`flex gap-3 ${c('fx-materialize', 'demo-child demo-child-materialize')}`} style={fd('0.15s')}>
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[9px] font-bold">AI</span>
            </div>
            <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-800/50 rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {typed(DEMO_QUESTION, 0.45, 0.1)}
              </p>
            </div>
          </div>

          {/* User answer — card materializes quickly, then its text types in word by word */}
          <div className="flex gap-3 justify-end mt-4">
            <div className={`bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%] ${c('fx-materialize', 'demo-child demo-child-materialize')}`} style={fd('2.6s')}>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {typed(DEMO_ANSWER, 2.85, 0.11)}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 ${c('fx-fade-in', 'demo-child demo-child-fade')}`} style={fd('2.7s')}>
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
          </div>

          {/* AI evaluation state — reserved strip that opens only while the AI
              analyses the answer (CSS-timed on the same timeline as the text,
              so it always appears right after typing and closes before the score) */}
          <div className="mt-4">
            <div className={c('fx-eval', 'demo-eval')}>
              <div className="flex items-center gap-2.5 pb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs text-slate-500 dark:text-slate-400">AI is evaluating your answer...</span>
              </div>
            </div>

            {/* Analytics — opens only AFTER the evaluation finishes (the panel
                occupies no space until then), so the card grows here instead of
                leaving a blank gap under the evaluation. */}
            <div className={c('fx-panel', 'demo-panel')}>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</span>
                  <span className={`inline-block ${c('fx-enter-pop', 'demo-child demo-child-pop')}`} style={fd('7.3s')}>
                    <Badge variant="success" className="text-[10px]">82 / 100</Badge>
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Depth', val: 85 },
                    { label: 'Clarity', val: 78 },
                    { label: 'Relevance', val: 90 },
                    { label: 'Grammar', val: 80 },
                    { label: 'Confidence', val: 75 },
                  ].map((m, idx) => (
                    <div key={m.label} className="text-center">
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full bg-brand-500 dark:bg-brand-400 rounded-full ${c('bar-fill', 'demo-bar')}`}
                          style={{ width: `${m.val}%`, '--fd': `${(6.9 + idx * 0.05).toFixed(2)}s` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature Card
   ───────────────────────────────────────────── */
function FeatureCard({ icon, title, description, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-200/50 dark:border-brand-800/50',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50',
  };

  return (
    <div className="group h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl border ${colorMap[color]} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Interview Type Card
   ───────────────────────────────────────────── */
function InterviewTypeCard({ icon, title, description, badge, badgeVariant }) {
  return (
    <div className="group h-full flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700/80 group-hover:text-slate-800 dark:group-hover:text-slate-200">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <Badge variant={badgeVariant} className="text-[10px]">{badge}</Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step Card
   ───────────────────────────────────────────── */
function StepCard({ number, title, description }) {
  return (
    <div className="relative text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white text-lg font-extrabold shadow-lg shadow-brand-500/20">
        {number}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN HOME PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.me()
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleTakeInterview = () => {
    router.push(user ? '/interview/setup' : '/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      {/* ─── Navigation ─── */}
      <TopNav username={user?.username} disableUserFetch />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-transparent to-transparent dark:from-brand-950/20 dark:via-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 dark:border-brand-800/60 fx-enter" style={{ '--fd': '0s' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">AI-Powered Interview Practice</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                <span className="block fx-enter" style={{ '--fd': '0.1s' }}>Practice like it&apos;s</span>
                <span className="block fx-enter bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent" style={{ '--fd': '0.22s' }}>the real interview.</span>
              </h1>

              {/* Subhead */}
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed fx-enter" style={{ '--fd': '0.34s' }}>
                Real-time AI interviews with adaptive follow-ups, instant scoring across 10 competencies, and personalized &ldquo;better answer&rdquo; feedback after every turn.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleTakeInterview}
                  style={{ '--fd': '0.46s' }}
                  className="px-8 py-3.5 text-base shadow-lg shadow-brand-500/20 fx-enter-pop"
                >
                  Start an Interview
                  <span className="ml-1">{Icons.arrow}</span>
                </Button>

                {user ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    style={{ '--fd': '0.58s' }}
                    className="px-8 py-3.5 text-base fx-enter-pop"
                  >
                    View Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/register')}
                    style={{ '--fd': '0.58s' }}
                    className="px-8 py-3.5 text-base fx-enter-pop"
                  >
                    Sign Up Free
                  </Button>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 dark:text-slate-500 fx-enter" style={{ '--fd': '0.7s' }}>
                <span className="flex items-center gap-1.5">{Icons.check} <span>10-point skill matrix</span></span>
                <span className="flex items-center gap-1.5">{Icons.check} <span>Adaptive difficulty</span></span>
                <span className="flex items-center gap-1.5">{Icons.check} <span>Instant feedback</span></span>
              </div>
            </div>

            {/* Right: Mockup */}
            <div className="hidden lg:block">
              <HeroMockup />
            </div>
          </div>

          {/* Mobile mockup (below copy on small screens) */}
          <div className="mt-12 lg:hidden">
            <HeroMockup mode="inview" />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Capabilities ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <Reveal className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Everything you need to ace your interview
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              From question generation to performance analytics — the complete toolkit for interview preparation.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Reveal delay={0} className="h-full">
              <FeatureCard
                icon={Icons.brain}
                title="Adaptive AI Questions"
                description="Dynamic follow-ups tailored to your answer depth, technical domain, and chosen branch."
                color="brand"
              />
            </Reveal>
            <Reveal delay={90} className="h-full">
              <FeatureCard
                icon={Icons.document}
                title="Resume-Based Interviews"
                description="Upload a resume to receive personalized questions based on your specific experience and skills."
                color="purple"
              />
            </Reveal>
            <Reveal delay={180} className="h-full">
              <FeatureCard
                icon={Icons.chart}
                title="Skill Analytics"
                description="Track performance across 10 competencies — technical depth, clarity, confidence, and more."
                color="emerald"
              />
            </Reveal>
            <Reveal delay={270} className="h-full">
              <FeatureCard
                icon={Icons.lightbulb}
                title="Better Answer Feedback"
                description="Review stronger example answers after every turn to learn optimal phrasing and depth."
                color="amber"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Interview Types ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <Reveal className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              One platform, every interview type
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Choose the format that matches your target role. Each type is powered by specialized AI evaluation.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Reveal delay={0} className="h-full">
              <InterviewTypeCard
                icon={Icons.tech}
                title="Technical"
                description="Branch-specific questions for Computer Science, Electronics, Mechanical, Civil, or Electrical engineering."
                badge="5 Branches"
                badgeVariant="brand"
              />
            </Reveal>
            <Reveal delay={90} className="h-full">
              <InterviewTypeCard
                icon={Icons.hr}
                title="HR"
                description="Behavioral and situational interview questions to practice communication and professional presence."
                badge="Behavioral"
                badgeVariant="info"
              />
            </Reveal>
            <Reveal delay={180} className="h-full">
              <InterviewTypeCard
                icon={Icons.aptitude}
                title="Aptitude"
                description="Problem-solving and analytical reasoning questions to sharpen your quantitative thinking."
                badge="Analytical"
                badgeVariant="warning"
              />
            </Reveal>
            <Reveal delay={270} className="h-full">
              <InterviewTypeCard
                icon={Icons.resume}
                title="Resume"
                description="Upload your resume and receive personalized questions drawn directly from your experience."
                badge="Personalized"
                badgeVariant="success"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── How It Works ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <Reveal className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Three steps to start improving
            </h2>
          </Reveal>

          <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-12 max-w-3xl mx-auto">
            {/* Connecting line (sm+) — draws as the steps reveal */}
            <Reveal variant="fade" delay={250} className="hidden sm:block absolute top-6 left-[16.66%] right-[16.66%] h-px pointer-events-none">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-brand-300 to-transparent dark:via-brand-700" />
            </Reveal>
            <Reveal delay={0} className="relative">
              <StepCard
                number="01"
                title="Choose your interview"
                description="Select your interview type, branch, and number of questions."
              />
            </Reveal>
            <Reveal delay={140} className="relative">
              <StepCard
                number="02"
                title="Interview with AI"
                description="Answer adaptive questions in real time as difficulty adjusts to your level."
              />
            </Reveal>
            <Reveal delay={280} className="relative">
              <StepCard
                number="03"
                title="Review and improve"
                description="Analyze scores, study better answers, and track your progress over time."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 px-8 py-16 sm:px-16 sm:py-20 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-brand-400/5 pointer-events-none" />
            {/* Slow ambient orbs (decorative, md+ only) */}
            <div aria-hidden className="absolute -top-32 -left-24 hidden md:block w-96 h-96 rounded-full bg-brand-500/10 blur-3xl fx-orb pointer-events-none" />
            <div aria-hidden className="absolute -bottom-36 -right-24 hidden md:block w-96 h-96 rounded-full bg-brand-400/10 blur-3xl fx-orb pointer-events-none" style={{ animationDelay: '-9s' }} />

            <div className="relative space-y-6">
              <Reveal variant="fade">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Ready to practice your next interview?
                </h2>
              </Reveal>
              <Reveal variant="fade" delay={120}>
                <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
                  Start a free AI-powered interview session and get instant, actionable feedback on your performance.
                </p>
              </Reveal>
              <Reveal variant="fade" delay={240}>
                <div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleTakeInterview}
                    className="px-10 py-4 text-base shadow-lg shadow-brand-500/25 hover:-translate-y-0.5"
                  >
                    Start an Interview
                    <span className="ml-1">{Icons.arrow}</span>
                  </Button>
                </div>
              </Reveal>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 transition-colors">
        <Reveal variant="fade" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-[9px] font-black">
              AI
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">AI Interviewer</span>
          </div>
          <p>&copy; {new Date().getFullYear()} AI Interviewer. All rights reserved.</p>
        </Reveal>
      </footer>
    </div>
  );
}
