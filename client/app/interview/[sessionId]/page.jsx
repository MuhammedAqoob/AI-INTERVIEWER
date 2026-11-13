'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Spinner, DifficultyBadge, Button, Textarea, Modal, Card } from '../../../components/ui';
import { useAuth } from '../../../components/AuthProvider';
import { useSpeechSettings } from '../../../components/SpeechSettingsProvider';
import { useSpeechSynthesis } from '../../../components/useSpeechSynthesis';
import { useSpeechRecognition } from '../../../components/useSpeechRecognition';
import VoiceSettingsMenu from '../../../components/VoiceControls';

// Time limit: 2 minutes per question
const MINUTES_PER_QUESTION = 2;

function getTimeLimitMs(questionLimit) {
  return questionLimit * MINUTES_PER_QUESTION * 60 * 1000;
}

// ── Pause-aware countdown bookkeeping ────────────────────────────────
// The backend only stores `startedAt`, so paused wall-clock time would keep
// counting against the user. We freeze it client-side by accumulating the
// paused duration per session in localStorage and subtracting it from elapsed.
const pauseKey = (sessionId) => `interview-pause:${sessionId}`;

function readPauseState(sessionId) {
  if (typeof window === 'undefined') return { pausedMs: 0, pausedAt: null };
  try {
    const raw = window.localStorage.getItem(pauseKey(sessionId));
    if (!raw) return { pausedMs: 0, pausedAt: null };
    const parsed = JSON.parse(raw);
    return {
      pausedMs: Number(parsed?.pausedMs) || 0,
      pausedAt: typeof parsed?.pausedAt === 'number' ? parsed.pausedAt : null,
    };
  } catch {
    return { pausedMs: 0, pausedAt: null };
  }
}

function writePauseState(sessionId, state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(pauseKey(sessionId), JSON.stringify(state));
  } catch {
    // Storage unavailable — timer simply runs without freeze.
  }
}

// Fold any in-progress pause into the accumulated total and return it.
function settlePause(sessionId) {
  const state = readPauseState(sessionId);
  if (state.pausedAt) {
    state.pausedMs += Date.now() - state.pausedAt;
    state.pausedAt = null;
    writePauseState(sessionId, state);
  }
  return state.pausedMs;
}

function markPaused(sessionId) {
  const state = readPauseState(sessionId);
  state.pausedAt = Date.now();
  writePauseState(sessionId, state);
}

function clearPauseState(sessionId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(pauseKey(sessionId));
  } catch {
    // ignore
  }
}

function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function Timer({ startedAt, questionLimit, onTimeUp, isActive, pauseOffsetMs = 0 }) {
  const [remaining, setRemaining] = useState(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!startedAt || !isActive) return;

    const start = new Date(startedAt).getTime();
    const limit = getTimeLimitMs(questionLimit);

    const tick = () => {
      const elapsed = Date.now() - start - pauseOffsetMs;
      const left = Math.max(0, Math.ceil((limit - elapsed) / 1000));
      setRemaining(left);
      if (left <= 0 && !endedRef.current) {
        endedRef.current = true;
        onTimeUp();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, questionLimit, onTimeUp, isActive, pauseOffsetMs]);

  if (remaining === null || !isActive) return null;

  const totalSeconds = getTimeLimitMs(questionLimit) / 1000;
  const pct = remaining / totalSeconds;
  const isLow = pct < 0.2;
  const isCritical = pct < 0.1;

  return (
    <span className={`inline-flex items-center gap-2 text-base font-mono font-bold px-4 py-2 rounded-full border shadow-sm ${
      isCritical
        ? 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 animate-pulse'
        : isLow
          ? 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700'
          : 'text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800'
    }`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {formatTime(remaining)}
    </span>
  );
}

function BetterAnswer({ betterAnswer }) {
  const [open, setOpen] = useState(false);
  if (!betterAnswer) return null;
  return (
    <div className="mt-1.5 text-left">
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer select-none"
      >
        {open ? '▾ Hide better answer' : '▸ Better answer'}
      </button>
      {open && (
        <div className="mt-1.5 p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {betterAnswer}
        </div>
      )}
    </div>
  );
}

// Human-friendly message for SpeechRecognition error codes.
function speechErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow it in your browser settings and try again.';
    case 'no-speech':
      return 'No speech detected. Tap the mic and try again.';
    case 'audio-capture':
      return 'No microphone was found on this device.';
    case 'network':
      return 'Voice input needs a network connection.';
    case 'unsupported':
    case 'start-failed':
      return 'Voice input is not supported in this browser.';
    default:
      return 'Voice input stopped. Please try again.';
  }
}

// Small circular AI avatar used in the transcript.
function AiAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l1.6 4.9L18.5 8.5 13.6 10 12 14.9 10.4 10 5.5 8.5l4.9-1.6L12 2zM5 15l.8 2.4 2.4.8-2.4.8L5 21.4 4.2 19 1.8 18.2 4.2 17.4 5 15zm14 0l.8 2.4 2.4.8-2.4.8L19 21.4l-.8-2.4-2.4-.8 2.4-.8L19 15z" />
      </svg>
    </div>
  );
}

// Radial voice visualizer: a gradient orb ringed by bars that pulse while
// speech synthesis or speech recognition is active.
const BAR_COUNT = 60;
const BAR_ANGLE = 360 / BAR_COUNT;

function VoiceVisualizer({ active }) {
  const bars = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    bars.push(
      <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * BAR_ANGLE}deg)` }}>
        <span
          className={`voice-bar absolute rounded-full ${
            active ? 'voice-bar--active bg-brand-500/70 dark:bg-brand-400/60' : 'bg-slate-300/80 dark:bg-slate-700/70'
          }`}
          style={{
            left: 'calc(50% - 1.5px)',
            top: '8px',
            width: '3px',
            height: '56px',
            '--bar-delay': `${((i % 15) * 0.06).toFixed(2)}s`,
            '--bar-dur': `${(0.7 + (i % 5) * 0.08).toFixed(2)}s`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-56 sm:h-56 lg:w-72 lg:h-72">
      <div className="absolute inset-0 hidden sm:block">{bars}</div>

      {/* Ripples — visible on every size, incl. mobile where the bars are hidden */}
      {active && (
        <>
          <span className="absolute w-16 h-16 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full border-2 border-brand-500/50 fx-ripple" />
          <span className="absolute w-16 h-16 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full border-2 border-brand-400/40 fx-ripple [animation-delay:0.9s]" />
        </>
      )}

      <div
        className={`relative w-16 h-16 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_0_60px_-10px_rgba(37,99,235,0.65)] flex items-center justify-center transition-transform duration-500 ${
          active ? 'fx-orb scale-105' : 'scale-100'
        }`}
      >
        <div className="absolute inset-2 rounded-full bg-white/10 blur-md" />
        <span className="relative text-white/90 font-black text-lg tracking-wide">AI</span>
      </div>
    </div>
  );
}

// Circular call-control button used along the bottom of the stage.
function StageButton({ label, onClick, active = false, danger = false, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-12 h-12 rounded-full border shadow-sm transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40 disabled:pointer-events-none ${
        danger
          ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
          : active
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-brand-600 dark:hover:text-brand-400'
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const config = {
    ACTIVE: { label: 'Live', dot: 'bg-emerald-500 animate-pulse' },
    PAUSED: { label: 'Paused', dot: 'bg-amber-500' },
    COMPLETED: { label: 'Completed', dot: 'bg-slate-400' },
  }[status] || { label: 'Live', dot: 'bg-emerald-500 animate-pulse' };

  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200">
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const { markGuest } = useAuth();
  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pauseOffset, setPauseOffset] = useState(0);

  const { autoSpeak } = useSpeechSettings();
  const speech = useSpeechSynthesis();
  const spokenRef = useRef(null);
  const prevAutoSpeakRef = useRef(autoSpeak);
  const speechBaseRef = useRef('');

  const handleTranscript = useCallback((spoken) => {
    const base = speechBaseRef.current;
    const combined = [base, spoken].filter(Boolean).join(' ').trim();
    setAnswer(combined.slice(0, 5000));
  }, []);
  const recognition = useSpeechRecognition({ onFinal: handleTranscript });

  const isCompleted = data?.status === 'COMPLETED';
  const isPaused = data?.status === 'PAUSED';
  const isActive = data?.status === 'ACTIVE';

  const load = async () => {
    setError('');
    // Fold any pending pause (from a previous "Pause & Leave") into the offset
    // before resuming, so paused time does not count against the countdown.
    setPauseOffset(settlePause(sessionId));
    try {
      let res = await interview.details(sessionId);
      if (res.data.status === 'PAUSED') {
        res = await interview.resume(sessionId);
      }
      setData(res.data);
    } catch (err) {
      if (err?.status === 401) {
        markGuest();
        router.push('/login');
      } else if (err?.status === 403 || err?.status === 404) {
        router.push('/history');
      } else {
        setError("Couldn't load this interview. Please try again.");
      }
    }
  };

  useEffect(() => {
    load();
  }, [sessionId]);

  const handleTimeUp = useCallback(async () => {
    speech.stop();
    try {
      const res = await interview.end(sessionId);
      clearPauseState(sessionId);
      router.push(`/history/${res.data.sessionId || sessionId}`);
    } catch {
      setError('Time is up! Session has been completed.');
      await load();
    }
  }, [sessionId, router, load, speech.stop]);

  const handlePauseAndLeave = async () => {
    setActionLoading(true);
    speech.stop();
    recognition.stop();
    try {
      if (isActive) {
        await interview.pause(sessionId);
        markPaused(sessionId);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to pause session.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleCompleteAndLeave = async () => {
    setActionLoading(true);
    speech.stop();
    recognition.stop();
    try {
      const res = await interview.end(sessionId);
      clearPauseState(sessionId);
      router.push(`/history/${res.data.sessionId || sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to complete session.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleDeleteAndLeave = async () => {
    setActionLoading(true);
    speech.stop();
    recognition.stop();
    try {
      await interview.delete(sessionId);
      clearPauseState(sessionId);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to delete session.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleRetake = async () => {
    setActionLoading(true);
    speech.stop();
    recognition.stop();
    try {
      const res = await interview.retake(sessionId);
      router.push(`/interview/${res.data.sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to start retake.');
    } finally {
      setActionLoading(false);
      setShowLeaveModal(false);
    }
  };

  const isNonResumeActive = isActive && data?.interviewType !== 'RESUME';

  const submit = async () => {
    if (!answer.trim() || sending) return;
    setSending(true);
    speech.stop();
    recognition.stop();
    try {
      const res = await interview.answer(sessionId, answer);
      setAnswer('');
      if (res.data.interviewEnded) {
        router.push(`/history/${sessionId}`);
      } else {
        await load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Re-arm auto-speak when it is switched back on (not on initial mount) so the
  // current question reads out, without a spurious double-speak under StrictMode.
  useEffect(() => {
    if (autoSpeak && !prevAutoSpeakRef.current) spokenRef.current = null;
    prevAutoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  // Speak each newly generated question exactly once. The ref key (question
  // number + text) makes this idempotent across re-renders and StrictMode's
  // double-invoked effects, and speak() cancels any prior utterance first.
  useEffect(() => {
    if (!autoSpeak || !isActive) return;
    // Wait for the async voice list so the female voice is applied on first play.
    if (speech.supported && speech.voices.length === 0) return;
    const content = data?.currentQuestion?.content;
    if (!content) return;
    const key = `${data.currentQuestionNumber}|${content}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    speech.speak(content);
  }, [
    autoSpeak,
    isActive,
    speech.supported,
    speech.voices.length,
    data?.currentQuestion?.content,
    data?.currentQuestionNumber,
    speech.speak,
  ]);

  const toggleMic = () => {
    if (recognition.listening) {
      recognition.stop();
      return;
    }
    // Never record while the interviewer is speaking (avoids capturing the TTS).
    speech.stop();
    speechBaseRef.current = answer;
    recognition.start();
  };

  if (!data && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Couldn't load this interview</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Please check your connection and try again, or head back to your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="primary" onClick={load}>Try Again</Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          <Spinner className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>{isCompleted ? 'Loading interview transcript...' : 'Connecting to AI Interview Room...'}</span>
        </div>
      </div>
    );
  }

  const answers = data.answers || [];
  const answeredCount = answers.length;
  const totalQuestions = data.questionLimit || 1;
  const progressPct = isCompleted
    ? 100
    : Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
  const questionNumber = data.currentQuestionNumber || answeredCount + 1;

  const questionText = data.currentQuestion?.content || '';
  const aiSpeaking = speech.speaking && !speech.paused;
  const isVoiceActive = aiSpeaking || recognition.listening;

  let statusCaption = 'Tap the mic to answer by voice';
  if (isCompleted) statusCaption = 'Session ended';
  else if (recognition.listening) statusCaption = 'You are speaking…';
  else if (aiSpeaking) statusCaption = 'AI interviewer is speaking…';
  else if (speech.paused) statusCaption = 'Playback paused';

  const primaryLabel = aiSpeaking ? 'Pause question' : speech.paused ? 'Resume question' : 'Play question';

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ═══ LEFT: Live voice stage ═══ */}
      <section className="relative flex flex-col shrink-0 w-full h-56 lg:h-full lg:w-[64%] overflow-hidden bg-slate-100/60 dark:bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
        {/* Status + timer pills */}
        <div className="flex items-center justify-between gap-2 p-2 sm:p-6">
          <StatusPill status={data.status} />
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 shadow-sm">
              Session ended
            </span>
          ) : (
            <Timer
              startedAt={data.startedAt}
              questionLimit={data.questionLimit}
              onTimeUp={handleTimeUp}
              isActive={isActive}
              pauseOffsetMs={pauseOffset}
            />
          )}
        </div>

        {/* Center visualizer */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 sm:gap-6 px-4 py-1">
          <VoiceVisualizer active={isVoiceActive} />
          <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {recognition.listening ? (
              <span className="w-4 h-4 text-rose-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </span>
            ) : (
              <span className={`w-4 h-4 ${aiSpeaking ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </span>
            )}
            {statusCaption}
          </p>
        </div>

        {/* Bottom call controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 pb-3 sm:pb-8 pt-1 sm:pt-2 px-4">
          {!isCompleted ? (
            <>
              <StageButton
                label={primaryLabel}
                active={aiSpeaking}
                disabled={!speech.supported || !questionText}
                onClick={() => {
                  if (aiSpeaking) speech.pause();
                  else if (speech.paused) speech.resume();
                  else if (questionText) speech.speak(questionText);
                }}
              >
                {aiSpeaking ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.14v13.72a1 1 0 001.53.85l10.76-6.86a1 1 0 000-1.7L9.53 4.29A1 1 0 008 5.14z" />
                  </svg>
                )}
              </StageButton>

              <StageButton
                label="Replay question"
                disabled={!speech.supported || !questionText}
                onClick={() => questionText && speech.speak(questionText)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 109-9 9 9 0 00-6.36 2.64M3 3v6h6" />
                </svg>
              </StageButton>

              <StageButton
                label={recognition.listening ? 'Stop voice input' : 'Answer with voice'}
                danger={recognition.listening}
                disabled={!recognition.supported || sending}
                onClick={toggleMic}
              >
                {recognition.listening ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="7" y="7" width="10" height="10" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
              </StageButton>

              {speech.supported && <VoiceSettingsMenu voices={speech.voices} />}

              <StageButton label="End interview" danger onClick={() => setShowLeaveModal(true)}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 010-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 00-2.67-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
              </StageButton>
            </>
          ) : (
            <Button variant="primary" onClick={() => router.push('/history')}>
              View Full Report
            </Button>
          )}
        </div>
      </section>

      {/* ═══ RIGHT: Live transcript sidebar ═══ */}
      <aside className="flex flex-col flex-1 min-h-0 lg:h-full overflow-hidden bg-white dark:bg-slate-950">
        <header className="shrink-0 px-4 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Transcript</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                {isCompleted ? 'Session ended' : `Live conversation · Question ${questionNumber} of ${data.questionLimit}`}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
              {data.interviewType}
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-r-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </header>

        {/* Message feed */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4 sm:px-5 sm:py-4 sm:space-y-5">
          {error && (
            <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {answers.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* AI Question */}
              <div className="flex items-start gap-2.5">
                <AiAvatar />
                <div className="min-w-0 max-w-[85%]">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                    AI Interviewer · Q{item.questionNumber}
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm leading-relaxed p-3 rounded-xl rounded-tl-sm whitespace-pre-wrap">
                    {item.question}
                  </div>
                </div>
              </div>

              {/* User Answer */}
              <div className="flex justify-end">
                <div className="max-w-[85%] min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 text-right">You</p>
                  <div className="bg-brand-600 text-white text-sm leading-relaxed p-3 rounded-xl rounded-br-sm whitespace-pre-wrap">
                    {item.userAnswer}
                  </div>
                  <BetterAnswer betterAnswer={item.betterAnswer} />
                  {item.analytics && (
                    <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                      {Object.entries(item.analytics).map(([key, val]) => (
                        <span key={key} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {key}: <strong>{val}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Current active question */}
          {!isCompleted && data.currentQuestion && (
            <div className="flex items-start gap-2.5 fx-enter">
              <AiAvatar />
              <div className="min-w-0 max-w-[88%] w-full">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    AI Interviewer · Question {questionNumber} of {data.questionLimit}
                  </p>
                  <DifficultyBadge difficulty={data.currentQuestion.difficulty} />
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/40 dark:border-brand-500/50 p-3.5 rounded-xl rounded-tl-sm shadow-sm">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {data.currentQuestion.content}
                  </p>
                  {autoSpeak && speech.supported && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-speak on
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Completed end state */}
          {isCompleted && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                This interview has been completed.
              </div>
            </div>
          )}
        </div>

        {/* Answer composer */}
        {!isCompleted && data.currentQuestion && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 space-y-2 sm:p-4 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Response
              </label>
              {recognition.listening && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Listening…
                </span>
              )}
            </div>

            <Textarea
              rows={2}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer, or tap the mic to speak…"
              maxLength={5000}
            />

            {recognition.listening && recognition.interim && (
              <p className="text-xs italic text-slate-400 dark:text-slate-500">“{recognition.interim}”</p>
            )}

            {recognition.error && (
              <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
                {speechErrorMessage(recognition.error)}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!recognition.supported}
                  aria-label={recognition.listening ? 'Stop voice input' : 'Answer with voice'}
                  title={
                    recognition.supported
                      ? recognition.listening
                        ? 'Stop voice input'
                        : 'Answer with voice'
                      : 'Voice input is not supported in this browser'
                  }
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                    recognition.listening
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700'
                  }`}
                >
                  {recognition.listening ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="7" y="7" width="10" height="10" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
                <p className={`text-xs ${answer.length > 5000 ? 'text-rose-500' : answer.length > 4500 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {answer.length} / 5,000
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                loading={sending}
                disabled={!answer.trim() || answer.length > 5000}
                onClick={submit}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                }
              >
                {sending ? 'Evaluating...' : 'Send Answer'}
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Leave Chat Modal — only for active/paused sessions */}
      {!isCompleted && (
        <Modal
          open={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Leave Interview?"
          description="Pause to resume later, complete to get your evaluation, or delete to remove this session entirely."
        >
          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaveModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePauseAndLeave}
              loading={actionLoading}
            >
              Pause & Leave
            </Button>
            {isNonResumeActive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetake}
                loading={actionLoading}
              >
                Retake Interview
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompleteAndLeave}
              loading={actionLoading}
            >
              Complete & Leave
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteAndLeave}
              loading={actionLoading}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-200 dark:border-rose-800"
            >
              Delete & Leave
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
