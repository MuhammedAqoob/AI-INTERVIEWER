'use client';

import { motion } from 'framer-motion';
import { BarChart2, CheckCircle, TrendingUp, Zap } from 'lucide-react';

export default function AnalyticsShowcase() {
  const competencies = [
    { label: 'Technical Knowledge', value: 94, color: 'bg-brand-500' },
    { label: 'Problem Solving Depth', value: 90, color: 'bg-purple-500' },
    { label: 'Communication Clarity', value: 88, color: 'bg-emerald-500' },
    { label: 'System Design Relevance', value: 96, color: 'bg-indigo-500' },
    { label: 'Grammar & Professionalism', value: 92, color: 'bg-amber-500' },
  ];

  return (
    <section id="analytics" className="py-24 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              10-Point Radar Matrix
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
              Quantifiable Feedback to Track Every Breakthrough
            </h2>

            <p className="text-base text-slate-400 leading-relaxed">
              Never wonder where you stand. Our AI evaluator computes granular scores across 10 critical competencies after every answer, generating instant progress trajectories.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Turn-by-turn breakdown</strong> of strengths, missing edge cases, and grammar.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Monotonic Resume boosts</strong> that enhance your existing domain profile without penalizing legacy scores.</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column Showcase Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">Candidate Evaluation Profile</h3>
                    <p className="text-xs text-slate-400">Overall Average: <span className="text-brand-400 font-bold">9.2 / 10</span></p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-full">
                  TOP 5% CANDIDATE
                </span>
              </div>

              {/* Competency Bars */}
              <div className="space-y-4">
                {competencies.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-100">{item.value}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
