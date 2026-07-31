'use client';

import { motion } from 'framer-motion';
import { Cpu, FileText, BarChart3, Binary, Lightbulb, Trophy } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-brand-400" />,
      title: 'Adaptive AI Evaluator',
      description: 'Generates tailored follow-up questions dynamically based on your previous answer difficulty and depth.',
      badge: 'Gemini Engine',
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      title: 'Resume PDF & Image Parser',
      description: 'Upload your resume in PDF or image format to get custom questions derived directly from your projects and skills.',
      badge: 'Smart Parsing',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
      title: '10-Point Skill Matrix',
      description: 'Evaluates technical depth, problem-solving, confidence, grammar, relevance, and professionalism on every turn.',
      badge: 'Real-time Matrix',
    },
    {
      icon: <Binary className="w-6 h-6 text-indigo-400" />,
      title: 'Branch Specialization',
      description: 'Select Computer Science, Electronics, Mechanical, Civil, or Electrical for targeted engineering domain questions.',
      badge: 'Domain Specific',
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-amber-400" />,
      title: 'Instant "Better Answer" Insights',
      description: 'See model exemplary answers after every question so you immediately learn optimal phrasing and depth.',
      badge: 'Actionable Feedback',
    },
    {
      icon: <Trophy className="w-6 h-6 text-rose-400" />,
      title: 'Global Competitive Leaderboard',
      description: 'Compete against other candidates globally across core criteria to rank on the public leaderboard.',
      badge: 'Live Rankings',
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            Enterprise Grade Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
            Engineered for High-Stakes Tech Interviews
          </h2>
          <p className="text-base text-slate-400">
            Everything you need to master your technical pitch, system architecture discussions, and behavioral responses.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative bg-slate-900/70 border border-slate-800/80 hover:border-brand-500/50 rounded-3xl p-8 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-100 group-hover:text-brand-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
