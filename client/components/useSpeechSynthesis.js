'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechSettings } from './SpeechSettingsProvider';

// Female-sounding voice hints, checked against the (lowercased) voice name.
// Ordered loosely by how reliable each name is across platforms.
const FEMALE_HINTS = [
  'female',
  'woman',
  'aria',
  'jenny',
  'zira',
  'samantha',
  'susan',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'serena',
  'victoria',
  'allison',
  'ava',
  'joanna',
  'salli',
  'amy',
  'emma',
  'olivia',
  'sonia',
  'natasha',
  'libby',
  'michelle',
  'google us english',
];

// Male hints used only to demote when nothing female is found.
const MALE_HINTS = [
  'male',
  'man',
  'david',
  'mark',
  'guy',
  'george',
  'daniel',
  'alex',
  'fred',
  'oliver',
  'thomas',
  'james',
  'ryan',
];

function isEnglish(voice) {
  return /^en([-_]|$)/i.test(voice.lang || '');
}

function scoreVoice(voice) {
  const name = (voice.name || '').toLowerCase();
  let score = 0;
  if (isEnglish(voice)) score += 100;
  if (FEMALE_HINTS.some((hint) => name.includes(hint))) score += 50;
  if (MALE_HINTS.some((hint) => name.includes(hint))) score -= 40;
  if (voice.localService) score += 5;
  if (voice.default) score += 2;
  return score;
}

function pickBestVoice(voices) {
  if (!voices.length) return null;
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

/**
 * Browser-native Text-to-Speech controller built on the Web Speech API.
 * Manages voice discovery, a single active utterance and play/pause/stop/replay.
 * Reads voice + rate preferences from SpeechSettingsProvider.
 */
export function useSpeechSynthesis() {
  const { voiceURI, setVoiceURI, rate } = useSpeechSettings();
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeText, setActiveText] = useState('');
  const utteranceRef = useRef(null);
  const speakTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Feature-detect and load voices, including the asynchronous `voiceschanged`
  // event (Chrome returns an empty list on first call).
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);
    const synth = window.speechSynthesis;

    const load = () => {
      const list = synth.getVoices() || [];
      if (list.length) setVoices(list);
    };

    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => {
      synth.removeEventListener?.('voiceschanged', load);
    };
  }, []);

  // Resolve the effective voice: the saved voiceURI if still available, else the
  // best-ranked female English voice on this system.
  let selectedVoice = null;
  if (voices.length) {
    selectedVoice = (voiceURI && voices.find((v) => v.voiceURI === voiceURI)) || pickBestVoice(voices);
  }

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    reset();
  }, [reset]);

  const speak = useCallback(
    (text) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const clean = typeof text === 'string' ? text.trim() : '';
      if (!clean) return;
      const synth = window.speechSynthesis;

      // Always drop any in-flight utterance so a new question never overlaps.
      synth.cancel();
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);

      const utter = new SpeechSynthesisUtterance(clean);
      if (selectedVoice) {
        utter.voice = selectedVoice;
        utter.lang = selectedVoice.lang;
      }
      utter.rate = rate;
      utter.pitch = 1.02;
      utter.onstart = () => {
        if (!mountedRef.current) return;
        setSpeaking(true);
        setPaused(false);
      };
      utter.onend = () => reset();
      utter.onerror = () => reset();
      utter.onpause = () => {
        if (mountedRef.current) setPaused(true);
      };
      utter.onresume = () => {
        if (mountedRef.current) setPaused(false);
      };

      utteranceRef.current = utter;
      setActiveText(clean);

      // Chrome/Safari can silently drop a speak() issued in the same tick as a
      // cancel(); deferring one short tick makes the handoff reliable.
      speakTimerRef.current = setTimeout(() => {
        speakTimerRef.current = null;
        if (!mountedRef.current) return;
        synth.speak(utter);
      }, 60);
    },
    [selectedVoice, rate, reset]
  );

  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const replay = useCallback(() => {
    if (activeText) speak(activeText);
  }, [activeText, speak]);

  // Cancel any speech when the consuming component unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    supported,
    voices,
    selectedVoice,
    voiceURI,
    setVoiceURI,
    speaking,
    paused,
    activeText,
    speak,
    pause,
    resume,
    stop,
    replay,
  };
}
