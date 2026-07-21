'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interview } from '../../../lib/api';
import { Spinner, DifficultyBadge } from '../../../components/ui';

export default function InterviewRoomPage() {
  const router = useRouter(); const { sessionId } = useParams();
  const [data, setData] = useState(null); const [answer, setAnswer] = useState(''); const [sending, setSending] = useState(false); const [error, setError] = useState('');
  const load = async () => {
    try {
      let res = await interview.details(sessionId);
      if (res.data.status === 'PAUSED') res = await interview.resume(sessionId);
      setData(res.data);
    } catch (err) {
      if (/not found|Unauthorized|403|404/i.test(err.message || '')) router.push('/history');
      else setError(err.message || 'Could not continue this interview. Please try again.');
    }
  };
  useEffect(() => { load(); }, [sessionId]);
  const leave = async () => { if (data?.status === 'ACTIVE') await interview.pause(sessionId); router.push('/dashboard'); };
  const submit = async () => { if (!answer.trim() || sending) return; setSending(true); try { const res = await interview.answer(sessionId, answer); setAnswer(''); if (res.data.interviewEnded) router.push(`/history/${sessionId}`); else await load(); } catch (err) { setError(err.message); } finally { setSending(false); } };
  if (!data) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-blue-600" /></div>;
  const answers = data.answers || [];
  return <div className="min-h-screen bg-gray-50"><nav className="bg-white border-b px-4 py-3"><div className="max-w-4xl mx-auto flex justify-between"><button onClick={leave} className="text-sm text-gray-600">← Back</button><span className="text-sm font-medium">{data.interviewType} · {data.currentQuestionNumber} / {data.questionLimit}</span></div></nav><main className="max-w-4xl mx-auto py-6 px-4 space-y-4">{error && <p className="text-red-600 text-sm">{error}</p>}{answers.map((item) => <article key={item.id} className="bg-white border rounded-xl p-5 space-y-3"><Block label={`Question ${item.questionNumber}`} value={item.question}/><Block label="Your Answer" value={item.userAnswer}/><Block label="Better Answer" value={item.betterAnswer}/><div className="text-xs text-gray-500">{Object.entries(item.analytics || {}).map(([key, value]) => `${key}: ${value}`).join(' · ')}</div></article>)}{data.currentQuestion && <section className="bg-white border border-blue-200 rounded-xl p-5"><div className="flex justify-between mb-3"><span className="text-sm font-semibold">Question {data.currentQuestionNumber} / {data.questionLimit}</span><DifficultyBadge difficulty={data.currentQuestion.difficulty}/></div><p className="mb-4 whitespace-pre-wrap">{data.currentQuestion.content}</p><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} className="w-full border rounded-xl p-3" placeholder="Write your answer..."/><button onClick={submit} disabled={sending || !answer.trim()} className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50">{sending ? 'Evaluating...' : 'Submit Answer'}</button></section>}</main></div>;
}
function Block({ label, value }) { return <div><p className="text-xs font-semibold text-gray-500 mb-1">{label}</p><p className="text-sm whitespace-pre-wrap">{value}</p></div>; }
