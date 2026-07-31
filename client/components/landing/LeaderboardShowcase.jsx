'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaderboardShowcase({ user }) {
  const router = useRouter();

  const topCandidates = [
    { rank: 1, name: 'Alex Rivera', score: '9.8 / 10', criteria: '10/10 evaluated', badge: '🥇 1st Place', color: 'border-amber-500/50 bg-amber-950/20' },
    { rank: 2, name: 'Sarah Chen', score: '9.5 / 10', criteria: '10/10 evaluated', badge: '🥈 2nd Place', color: 'border-slate-400/50 bg-slate-800/40' },
    { rank: 3, name: 'Marcus Vance', score: '9.2 / 10', criteria: '10/10 evaluated', badge: '🥉 3rd Place', color: 'border-orange-500/50 bg-orange-950/20' },
  ];

  return (
    <section id="leaderboard" className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            Public Competitive Rankings
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
            Compare Your Prep Against Top Candidates
          </h2>
          <p className="text-base text-slate-400">
            Every core interview evaluation contributes to your overall score on the public leaderboard.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {topCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`border rounded-2xl p-5 flex items-center justify-between gap-4 ${candidate.color} shadow-lg`}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-lg">
                  {candidate.rank}
                </span>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{candidate.name}</h3>
                  <p className="text-xs text-slate-400">{candidate.criteria}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 block">{candidate.score}</span>
                <span className="text-[11px] font-semibold text-slate-400">{candidate.badge}</span>
              </div>
            </motion.div>
          ))}

          <div className="text-center pt-6">
            <button
              onClick={() => router.push('/leaderboard')}
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              <span>View Full Public Leaderboard (Top 50)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
