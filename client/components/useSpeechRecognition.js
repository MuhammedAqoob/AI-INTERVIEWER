'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser-native Speech-to-Text input built on the Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition — Chromium-based browsers).
 * Streams an interim transcript while listening and reports the accumulated
 * final transcript through `onFinal`.
 */
export function useSpeechRecognition({ lang = 'en-US', onFinal } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const finalRef = useRef('');
  const onFinalRef = useRef(onFinal);
  const mountedRef = useRef(true);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setError('unsupported');
      return;
    }
    try {
      recognitionRef.current?.abort?.();
    } catch {
      // ignore
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    finalRef.current = '';
    setError('');
    setInterim('');

    rec.onstart = () => {
      if (mountedRef.current) setListening(true);
    };
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) {
        finalRef.current = `${finalRef.current} ${finalText}`.trim();
        onFinalRef.current?.(finalRef.current);
      }
      if (mountedRef.current) setInterim(interimText);
    };
    rec.onerror = (event) => {
      if (!mountedRef.current) return;
      setError(event?.error || 'error');
      setListening(false);
      setInterim('');
    };
    rec.onend = () => {
      if (!mountedRef.current) return;
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('start-failed');
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
