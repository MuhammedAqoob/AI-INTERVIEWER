'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      quote: "AI Interviewer helped me spot huge gaps in my System Design explanations. The suggested 'Better Answer' after each question gave me the exact terminology I needed for my Amazon interview.",
      name: "David K.",
      role: "Senior Software Engineer",
      company: "Landed offer at Big Tech",
      stars: 5,
    },
    {
      quote: "The Resume Upload feature is unbelievable. It parsed my microservices project and asked me questions harder than my actual interviewer did. 10/10 recommendation.",
      name: "Priya S.",
      role: "Backend Developer",
      company: "Landed L4 SWE role",
      stars: 5,
    },
    {
      quote: "Practicing under real-time dynamic questioning cured my interview anxiety. Seeing my radar competency score improve gave me so much confidence.",
      name: "Michael T.",
      role: "Full Stack Engineer",
      company: "Series B Startup SWE",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 bg-slate-950/90 border-t border-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            Candidate Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
            Loved by Developers & Engineers Worldwide
          </h2>
          <p className="text-base text-slate-400">
            See how candidates transformed their interview outcomes using AI Interviewer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, index) => (
            <motion.div
              key={rev.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: rev.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-slate-700" />
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{rev.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <p className="font-bold text-slate-100 text-base">{rev.name}</p>
                <p className="text-xs text-brand-400 font-medium">{rev.role}</p>
                <p className="text-[11px] text-slate-500">{rev.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
