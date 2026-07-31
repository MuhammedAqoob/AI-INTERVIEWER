'use client';

import { motion } from 'framer-motion';
import { Award, Users, Zap, CheckCircle } from 'lucide-react';

export default function Stats() {
  const metrics = [
    {
      value: '50,000+',
      label: 'Mock Interviews Evaluated',
      sub: 'Across CS, ECE, ME & Resume tracks',
      icon: <Users className="w-5 h-5 text-brand-400" />,
    },
    {
      value: '94%',
      label: 'Candidate Offer Increase',
      sub: 'Reported after 3+ practice sessions',
      icon: <Award className="w-5 h-5 text-emerald-400" />,
    },
    {
      value: '< 400ms',
      label: 'AI Evaluation Latency',
      sub: 'Powered by Redis caching layer',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      value: '10-Point',
      label: 'Skill Matrix Analytics',
      sub: 'Grammar, depth, logic & communication',
      icon: <CheckCircle className="w-5 h-5 text-purple-400" />,
    },
  ];

  return (
    <section className="py-16 bg-slate-950/80 border-y border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-slate-800/80 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Verified Metric
                </span>
              </div>
              <p className="text-3xl font-black text-slate-100 tracking-tight mb-1">
                {item.value}
              </p>
              <p className="text-sm font-bold text-slate-300 mb-0.5">{item.label}</p>
              <p className="text-xs text-slate-500">{item.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
