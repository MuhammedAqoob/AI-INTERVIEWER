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
  '#2563eb', '#7c3aed', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#4f46e5', '#0d9488',
];

export default function AnalyticsChart({ analytics }) {
  const data = Object.entries(analytics || {}).map(([key, value]) => ({
    key,
    name: LABELS[key] || key,
    value: Math.round(Number(value) || 0),
  }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No analytics available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 38)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: '#374151' }}
        />
        <Tooltip
          cursor={{ fill: '#f3f4f6' }}
          formatter={(value) => [`${value}%`, 'Score']}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fill: '#374151', formatter: (v) => `${v}%` }}>
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
