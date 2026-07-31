'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Play, Mic, ShieldCheck, CheckCircle2, Cpu, Zap } from 'lucide-react';

export default function Hero({ user }) {
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push('/interview/setup');
    } else {
      router.push('/register');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient Grid & Radial Blur Glow Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-brand-600/30 to-purple-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Column: Text & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-slate-400">Introducing AI Interviewer 2.0</span>
              <span className="text-slate-700">|</span>
              <span className="text-brand-400 flex items-center gap-1">
                Powered by Gemini & Redis <Sparkles className="w-3 h-3" />
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 leading-[1.1]">
              Ace Technical Interviews with{' '}
              <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Real-Time AI Coaching
              </span>
            </h1>

            {/* Supporting Subheading */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
              Simulate high-stakes System Design, Data Structures, and HR interviews. Receive instant 10-point competency evaluations and suggested better answers.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleStart}
                className="px-8 py-4 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98] transition-all flex items-center gap-2.5 group"
              >
                <span>Start Free Interview</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="px-7 py-4 text-sm font-bold text-slate-300 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center gap-2 backdrop-blur-md"
              >
                <Play className="w-4 h-4 text-brand-400 fill-brand-400/20" />
                <span>Explore Features</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-900 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Instant Evaluation & Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Supports CS, ECE, ME, & Resume Upload</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive UI Mockup Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Glowing Backdrop Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 animate-pulse" />

            <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-500 font-mono ml-2">live_session_active.jsx</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-rose-950/60 border border-rose-800/60 text-rose-400 rounded-full text-[11px] font-bold tracking-wide animate-pulse">
                  <Mic className="w-3 h-3" />
                  <span>RECORDING</span>
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-400 uppercase tracking-wider">Question 3 of 5</span>
                  <span className="px-2 py-0.5 bg-rose-950 text-rose-300 text-[10px] font-semibold rounded-full border border-rose-800/60">HARD</span>
                </div>
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  "Explain how you would handle race conditions during high-concurrency database writes in a distributed system."
                </p>
              </div>

              {/* Live Audio Waveform Simulation */}
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Zap className="w-4 h-4 text-brand-400" />
                  <span className="font-mono text-[11px]">AI Voice Processing...</span>
                </div>
                <div className="flex items-end gap-1 h-5">
                  <span className="w-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0ms]" style={{ height: '60%' }} />
                  <span className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" style={{ height: '100%' }} />
                  <span className="w-1 bg-brand-400 rounded-full animate-bounce [animation-delay:300ms]" style={{ height: '40%' }} />
                  <span className="w-1 bg-purple-500 rounded-full animate-bounce [animation-delay:200ms]" style={{ height: '80%' }} />
                  <span className="w-1 bg-brand-500 rounded-full animate-bounce [animation-delay:100ms]" style={{ height: '50%' }} />
                </div>
              </div>

              {/* Floating Real-Time Score Mini Card */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Technical Depth</span>
                  <span className="text-2xl font-black text-emerald-300">9.4<span className="text-xs text-emerald-500 font-normal"> / 10</span></span>
                </div>
                <div className="bg-brand-950/40 border border-brand-800/50 rounded-xl p-3 text-left">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block">Relevance</span>
                  <span className="text-2xl font-black text-brand-300">9.8<span className="text-xs text-brand-500 font-normal"> / 10</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
