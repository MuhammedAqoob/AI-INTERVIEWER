'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTASection({ user }) {
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push('/interview/setup');
    } else {
      router.push('/register');
    }
  };

  return (
    <section className="py-20 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-r from-brand-900/80 via-slate-900 to-purple-950/80 border border-brand-500/30 rounded-3xl p-10 sm:p-16 text-center overflow-hidden shadow-2xl space-y-6"
        >
          {/* Ambient Glow background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Transform Your Career Today
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-100 leading-tight">
              Ready to Land Your Dream Tech Offer?
            </h2>

            <p className="text-base text-slate-300">
              Join thousands of developers using AI Interviewer to practice technical depth, system design, and behavioral questions.
            </p>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleStart}
                className="px-8 py-4 text-sm font-extrabold text-slate-950 bg-slate-100 hover:bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group"
              >
                <span>{user ? 'Start Practice Session' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
