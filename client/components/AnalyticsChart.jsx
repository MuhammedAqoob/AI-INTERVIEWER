'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from './ThemeProvider';

const LABELS = {
  technicalKnowledge: 'Technical',
  communication: 'Communication',
  problemSolving: 'Problem Solving',
  confidence: 'Confidence',
  grammar: 'Grammar',
  leadership: 'Leadership',
  teamwork: 'Teamwork',
  relevance: 'Relevance',
  professionalism: 'Professionalism',
};

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6',
];

export default function AnalyticsChart({ analytics }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const data = Object.entries(analytics || {}).map(([key, value]) => ({
    key,
    name: LABELS[key] || key,
    value: Math.round(Number(value) || 0),
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">No analytics available yet.</p>;
  }

  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const cursorColor = isDark ? '#1e293b' : '#f1f5f9';

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 30, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: textColor }}
          stroke={gridColor}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: textColor }}
          stroke={gridColor}
        />
        <Tooltip
          cursor={{ fill: cursorColor }}
          contentStyle={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#334155' : '#cbd5e1',
            borderRadius: '0.75rem',
            color: isDark ? '#f8fafc' : '#0f172a',
          }}
          formatter={(value) => [`${value}%`, 'Score']}
        />
        <Bar
          dataKey="value"
          radius={[0, 6, 6, 0]}
          label={{
            position: 'right',
            fontSize: 12,
            fill: textColor,
            formatter: (v) => `${v}%`,
          }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
