'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useTheme } from './ThemeProvider';

const METRIC_LABELS = {
  technology: 'Technology',
  problemSolving: 'Problem Solving',
  criticalThinking: 'Critical Thinking',
  communication: 'Communication',
  leadership: 'Leadership',
  professionalism: 'Professionalism',
  confidence: 'Confidence',
  logicalReasoning: 'Logical Reasoning',
  accuracy: 'Accuracy',
  speed: 'Speed',
};

const METRIC_ORDER = [
  'technology',
  'problemSolving',
  'criticalThinking',
  'communication',
  'leadership',
  'professionalism',
  'confidence',
  'logicalReasoning',
  'accuracy',
  'speed',
];

const CATEGORY_ORDER = ['TECHNICAL', 'HR', 'APTITUDE'];
const CATEGORY_LABELS = { TECHNICAL: 'Technical', HR: 'HR', APTITUDE: 'Aptitude' };

const COLOR_A = '#3b82f6'; // brand blue
const COLOR_B = '#10b981'; // emerald

const toScore = (value) => Math.round(Number(value) || 0);

function rankedMetrics(row) {
  return METRIC_ORDER.map((key) => ({
    key,
    label: METRIC_LABELS[key],
    value: toScore(row?.criterionScores?.[key]),
  })).sort((a, b) => b.value - a.value);
}

function MetricPills({ items, tone }) {
  const toneClass =
    tone === 'strong'
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((m) => (
        <span
          key={m.key}
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border ${toneClass}`}
        >
          {m.label}
          <span className="font-bold tabular-nums">{m.value}</span>
        </span>
      ))}
    </div>
  );
}

function UserSummaryCard({ row, color, isYou }) {
  const ranked = rankedMetrics(row);
  const strengths = ranked.slice(0, 3);
  const weaknesses = [...ranked].reverse().slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {row.username}
            {isYou && <span className="ml-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">(You)</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-extrabold leading-none text-slate-900 dark:text-slate-100">{row.averageScore}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">overall avg</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            Strong points
          </p>
          <MetricPills items={strengths} tone="strong" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
            Weak points
          </p>
          <MetricPills items={weaknesses} tone="weak" />
        </div>
      </div>
    </div>
  );
}

export default function CompareUsers({ rows, currentUser, initialB }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const usernames = rows.map((r) => r.username);
  const defaultA = usernames.includes(currentUser) ? currentUser : usernames[0];
  const defaultB = usernames.find((u) => u !== defaultA) || defaultA;

  const [aName, setAName] = useState(defaultA);
  const [bName, setBName] = useState(initialB && initialB !== defaultA ? initialB : defaultB);

  const rowA = rows.find((r) => r.username === aName) || rows[0];
  const rowB = rows.find((r) => r.username === bName) || rows[0];

  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const cursorColor = isDark ? '#1e293b' : '#f1f5f9';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '0.75rem',
    color: isDark ? '#f8fafc' : '#0f172a',
  };

  const categoryData = CATEGORY_ORDER.map((cat) => ({
    category: CATEGORY_LABELS[cat],
    a: toScore(rowA.categoryScores?.[cat]),
    b: toScore(rowB.categoryScores?.[cat]),
  }));

  const radarData = METRIC_ORDER.map((key) => ({
    metric: METRIC_LABELS[key],
    a: toScore(rowA.criterionScores?.[key]),
    b: toScore(rowB.criterionScores?.[key]),
  }));

  const gaps = METRIC_ORDER.map((key) => {
    const a = toScore(rowA.criterionScores?.[key]);
    const b = toScore(rowB.criterionScores?.[key]);
    return { key, label: METRIC_LABELS[key], a, b, diff: a - b };
  });
  const aEdges = gaps.filter((g) => g.diff > 0).sort((x, y) => y.diff - x.diff).slice(0, 4);
  const bEdges = gaps.filter((g) => g.diff < 0).sort((x, y) => x.diff - y.diff).slice(0, 4);

  const leader =
    rowA.averageScore === rowB.averageScore
      ? null
      : rowA.averageScore > rowB.averageScore
        ? rowA
        : rowB;

  return (
    <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-1">
      {/* User selectors */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <select
          value={aName}
          onChange={(e) => setAName(e.target.value)}
          aria-label="First user"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {usernames.map((u) => (
            <option key={u} value={u}>{u}{u === currentUser ? ' (You)' : ''}</option>
          ))}
        </select>
        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">VS</span>
        <select
          value={bName}
          onChange={(e) => setBName(e.target.value)}
          aria-label="Second user"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {usernames.map((u) => (
            <option key={u} value={u}>{u}{u === currentUser ? ' (You)' : ''}</option>
          ))}
        </select>
      </div>

      {leader && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-slate-100">{leader.username}</span> leads overall by{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {Math.abs(rowA.averageScore - rowB.averageScore).toFixed(2)}
          </span>{' '}
          points
        </p>
      )}

      {/* X / Y category comparison */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          Category Comparison
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Average score per interview type (0–100)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: textColor }} stroke={gridColor} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: textColor }} stroke={gridColor} />
            <Tooltip cursor={{ fill: cursorColor }} contentStyle={tooltipStyle} formatter={(value) => `${value}%`} />
            <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
            <Bar dataKey="a" name={rowA.username} fill={COLOR_A} radius={[6, 6, 0, 0]} maxBarSize={56} />
            <Bar dataKey="b" name={rowB.username} fill={COLOR_B} radius={[6, 6, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spider / radar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          Skill Radar
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">All ten competencies overlaid (0–100)</p>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: textColor }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: textColor }} stroke={gridColor} />
            <Radar name={rowA.username} dataKey="a" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.35} />
            <Radar name={rowB.username} dataKey="b" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.35} />
            <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Strengths / weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <UserSummaryCard row={rowA} color={COLOR_A} isYou={rowA.username === currentUser} />
        <UserSummaryCard row={rowB} color={COLOR_B} isYou={rowB.username === currentUser} />
      </div>

      {/* Head-to-head edges */}
      {(aEdges.length > 0 || bEdges.length > 0) && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Head-to-Head Edges</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {rowA.username} leads
              </p>
              {aEdges.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">No category leads.</p>
              ) : (
                <ul className="space-y-1.5">
                  {aEdges.map((g) => (
                    <li key={g.key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{g.label}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{g.diff}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {rowB.username} leads
              </p>
              {bEdges.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">No category leads.</p>
              ) : (
                <ul className="space-y-1.5">
                  {bEdges.map((g) => (
                    <li key={g.key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{g.label}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{g.diff}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
