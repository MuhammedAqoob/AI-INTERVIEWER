'use client';

import { motion } from 'framer-motion';
import { FileUp, Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResumeShowcase({ user }) {
  const router = useRouter();

  return (
    <section id="resume-ai" className="py-24 bg-slate-950/90 border-t border-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Graphic / Dropzone preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="border-2 border-dashed border-purple-500/40 bg-purple-950/20 rounded-2xl p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">resume_john_doe_swe.pdf</p>
                  <p className="text-xs text-slate-400 mt-0.5">Parsed 4 Projects & 12 Technical Skills</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PDF Parsed Successfully
                </div>
              </div>

              {/* Sample Generated Questions derived from resume */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Tailored Questions Generated:
                </span>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                  ⚡ "I noticed you built a Redis caching layer for microservices. How did you handle cache invalidation?"
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                  ⚡ "You listed React & Next.js App Router on your resume. Explain server vs client component hydration."
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column Text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Resume-Specific Interviews
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
              Practice Questions Tailored Directly to Your Resume
            </h2>

            <p className="text-base text-slate-400 leading-relaxed">
              Don't just practice generic questions. Upload your resume in PDF or image format to extract your specific technologies, work history, and portfolio projects.
            </p>

            <div className="pt-2">
              <button
                onClick={() => router.push(user ? '/interview/setup' : '/register')}
                className="px-6 py-3.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
              >
                <span>Upload Resume & Practice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
