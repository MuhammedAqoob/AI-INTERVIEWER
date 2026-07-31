'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is AI Interviewer free to use?',
      a: 'Yes! You get free daily interview sessions across Technical, HR, Aptitude, and Resume tracks without requiring a credit card.',
    },
    {
      q: 'What engineering branches and interview types are supported?',
      a: 'We support Computer Science, Electronics, Mechanical, Civil, and Electrical engineering branches, as well as HR behavioral, Aptitude logic, and Resume project deep-dives.',
    },
    {
      q: 'How does the Resume Upload feature work?',
      a: 'Upload your resume in PDF, JPEG, or PNG format up to 5MB. Our AI extracts your projects, technologies, and experience to generate tailored follow-up questions.',
    },
    {
      q: 'How is my score calculated for the Global Leaderboard?',
      a: 'Your overall score is calculated across core competency criteria (technical depth, logic, communication, etc.). Every core criterion has equal weight to ensure fair rankings.',
    },
    {
      q: 'Can I pause an ongoing interview and resume it later?',
      a: 'Absolutely! If you leave an active session, your progress is saved so you can resume anytime directly from your Dashboard.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-base text-slate-400">
            Everything you need to know about the AI Interviewer platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-100 hover:text-brand-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-brand-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
