'use client';

import { motion } from 'framer-motion';
import { Sliders, MessageSquareCode, Award } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Configure Your Practice Session',
      description: 'Choose between Technical, HR, Aptitude, or Resume-based interviews. Pick your engineering branch and question limit.',
      icon: <Sliders className="w-6 h-6 text-brand-400" />,
      tag: 'Step 1: Setup',
    },
    {
      num: '02',
      title: 'Answer Adaptive AI Questions',
      description: 'Experience real-time dynamic questioning. The AI evaluates your answer depth and adjusts difficulty turn-by-turn.',
      icon: <MessageSquareCode className="w-6 h-6 text-purple-400" />,
      tag: 'Step 2: Interview',
    },
    {
      num: '03',
      title: 'Receive Instant Evaluation & Insights',
      description: 'Analyze your 10-point competency scores, review suggested better answers, and track your global rank.',
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      tag: 'Step 3: Review',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-950/90 border-t border-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            Simple 3-Step Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
            How AI Interviewer Works
          </h2>
          <p className="text-base text-slate-400">
            From setup to comprehensive feedback in under 10 minutes.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500/20 via-purple-500/30 to-emerald-500/20 -translate-y-6 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                    {step.num}
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                    {step.icon}
                  </div>
                </div>

                <span className="inline-block text-[11px] font-bold text-brand-400 bg-brand-950/60 border border-brand-800/60 px-2.5 py-1 rounded-full">
                  {step.tag}
                </span>

                <h3 className="text-xl font-bold text-slate-100">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
