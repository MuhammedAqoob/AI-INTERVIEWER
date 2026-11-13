'use client';

import { useEffect, useRef, useState } from 'react';
import { useSpeechSettings } from './SpeechSettingsProvider';

const GEAR_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.94c.27-1.24 2.05-1.24 2.32 0a1.72 1.72 0 002.58 1.07c1.08-.63 2.34.63 1.71 1.71a1.72 1.72 0 001.07 2.58c1.24.27 1.24 2.05 0 2.32a1.72 1.72 0 00-1.07 2.58c.63 1.08-.63 2.34-1.71 1.71a1.72 1.72 0 00-2.58 1.07c-.27 1.24-2.05 1.24-2.32 0a1.72 1.72 0 00-2.58-1.07c-1.08.63-2.34-.63-1.71-1.71a1.72 1.72 0 00-1.07-2.58c-1.24-.27-1.24-2.05 0-2.32a1.72 1.72 0 001.07-2.58C5.42 6.35 6.68 5.1 7.76 5.72a1.72 1.72 0 002.58-1.07z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

/**
 * Circular voice-settings button with a popover for the auto-speak toggle,
 * voice choice and speech rate. Opens upward (sits in the call-controls row).
 */
export default function VoiceSettingsMenu({ voices = [] }) {
  const { autoSpeak, setAutoSpeak, voiceURI, setVoiceURI, rate, setRate } = useSpeechSettings();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Voice settings"
        aria-expanded={open}
        title="Voice settings"
        className={`inline-flex items-center justify-center w-12 h-12 rounded-full border shadow-sm transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
          open
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-brand-600 dark:hover:text-brand-400'
        }`}
      >
        {GEAR_ICON}
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Auto-speak</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Read each new question aloud</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoSpeak}
              aria-label="Toggle auto-speak"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                autoSpeak ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  autoSpeak ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label htmlFor="voice-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Voice
            </label>
            <select
              id="voice-select"
              value={voiceURI}
              onChange={(e) => setVoiceURI(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Auto — best female English voice</option>
              {(voices.filter((v) => /^en([-_]|$)/i.test(v.lang || '')).length
                ? voices.filter((v) => /^en([-_]|$)/i.test(v.lang || ''))
                : voices
              ).map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="voice-rate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Speed
              </label>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                {rate.toFixed(2)}x
              </span>
            </div>
            <input
              id="voice-rate"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
