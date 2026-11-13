'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Persisted voice preferences, mirroring ThemeProvider's localStorage pattern so
// the app never flashes or loses the user's speech choices between visits.
const STORAGE_KEY = 'speech-prefs';

const DEFAULTS = {
  autoSpeak: true,
  voiceURI: '',
  rate: 1,
};

const SpeechSettingsContext = createContext({
  ...DEFAULTS,
  setAutoSpeak: () => {},
  setVoiceURI: () => {},
  setRate: () => {},
  mounted: false,
});

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function readPrefs() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      autoSpeak: typeof parsed?.autoSpeak === 'boolean' ? parsed.autoSpeak : DEFAULTS.autoSpeak,
      voiceURI: typeof parsed?.voiceURI === 'string' ? parsed.voiceURI : DEFAULTS.voiceURI,
      rate: Number.isFinite(parsed?.rate) ? clamp(parsed.rate, 0.5, 1.5) : DEFAULTS.rate,
    };
  } catch {
    return DEFAULTS;
  }
}

export function SpeechSettingsProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable — settings simply won't persist across reloads.
    }
  }, [prefs, mounted]);

  const setAutoSpeak = useCallback((value) => {
    setPrefs((prev) => ({ ...prev, autoSpeak: !!value }));
  }, []);
  const setVoiceURI = useCallback((value) => {
    setPrefs((prev) => ({ ...prev, voiceURI: value || '' }));
  }, []);
  const setRate = useCallback((value) => {
    setPrefs((prev) => ({ ...prev, rate: clamp(value, 0.5, 1.5) }));
  }, []);

  return (
    <SpeechSettingsContext.Provider
      value={{ ...prefs, setAutoSpeak, setVoiceURI, setRate, mounted }}
    >
      {children}
    </SpeechSettingsContext.Provider>
  );
}

export function useSpeechSettings() {
  return useContext(SpeechSettingsContext);
}
