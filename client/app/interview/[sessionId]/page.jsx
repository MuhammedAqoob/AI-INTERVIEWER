'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [livesDepleted, setLivesDepleted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async () => {
    try {
      const statusResult = await interview.status(sessionId);
      const data = statusResult.data;

      if (!data || data.hasActiveSession === false) {
        router.push('/dashboard');
        return;
      }

      setSessionInfo(data);
      setQuestionCount(data.totalQuestions);
      setTotalScore(data.accumulatedScore);
      setExpiresAt(data.expiresAt);

      if (data.lifeConsumed) {
        try {
          const statsResult = await fetch('/api/dashboard/summary', {
            credentials: 'include',
          }).then((r) => r.json());
          if (statsResult.data && statsResult.data.livesRemaining <= 0) {
            setLivesDepleted(true);
          }
        } catch {
          // If we can't check lives, don't block the session
        }
      }

      const conversation = data.conversation || [];
      const formatted = conversation.map((msg, i) => ({
        id: `msg-${i}`,
        role: msg.role,
        content: msg.content,
      }));

      setMessages(formatted);
    } catch (err) {
      if (
        err.message.includes('not found') ||
        err.message.includes('expired') ||
        err.message.includes('no longer active')
      ) {
        router.push('/dashboard');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await interview.answer(sessionId, userMessage.content);
      const data = res.data;

      setTotalScore(data.currentScore);
      setQuestionCount(data.totalQuestions);

      if (data.interviewEnded && data.reason === 'NO_LIVES') {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.evaluation?.feedback || 'Answer evaluated.',
        };
        setMessages((prev) => [...prev, aiMessage]);

        setTimeout(() => {
          const systemMessage = {
            id: Date.now() + 2,
            role: 'system',
            content: "You have used all today's interview lives.",
          };
          setMessages((prev) => [...prev, systemMessage]);
        }, 500);

        setLivesDepleted(true);
        return;
      }

      if (data.sessionStatus === 'COMPLETED') {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Interview complete. Here are your results.',
        };
        setMessages((prev) => [...prev, aiMessage]);

        setTimeout(() => {
          router.push(
            `/interview/results?sessionId=${sessionId}&score=${data.currentScore}&questions=${data.totalQuestions}`
          );
        }, 2000);
        return;
      }

      if (data.nextQuestion) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.nextQuestion.content,
          difficulty: data.nextQuestion.difficulty,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading interview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {sessionInfo?.interviewType} Interview
                {sessionInfo?.branch && ` — ${sessionInfo.branch}`}
              </div>
              <div className="text-xs text-gray-400">
                Q{questionCount} • Score: {totalScore} • {sessionInfo?.difficulty}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expiresAt && (
              <ExpiresTimer expiresAt={expiresAt} />
            )}
          </div>
        </div>
      </nav>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={livesDepleted ? "No lives remaining. Come back tomorrow." : "Type your answer..."}
              rows={1}
              disabled={livesDepleted}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || livesDepleted}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  if (message.role === 'system') {
    return (
      <div className="text-center">
        <span className="inline-block px-4 py-2 bg-gray-100 text-gray-500 text-xs rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
        {message.difficulty && (
          <div className="mt-2">
            <DifficultyBadge difficulty={message.difficulty} />
          </div>
        )}
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }) {
  const colors = {
    EASY: 'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HARD: 'bg-rose-100 text-rose-700',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors[difficulty] || colors.EASY}`}>
      {difficulty}
    </span>
  );
}

function ExpiresTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const exp = new Date(expiresAt);
      const diff = exp - now;

      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${hours}h ${mins}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="text-xs text-gray-400 tabular-nums">
      Expires in {remaining}
    </span>
  );
}
