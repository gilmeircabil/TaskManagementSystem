import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency } from '../utils/format';
import { CATEGORY_COLORS } from '../utils/constants';

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--forest-dark)',
        color: 'var(--paper)',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12.5,
      }}
    >
      {label && <div style={{ marginBottom: 4, opacity: 0.7 }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

/**
 * type: 'category-pie' | 'income-vs-expense-bar' | 'trend-line'
 * data: array of records shaped for the chosen type
 */
export default function Chart({ type, data, height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ height }}>
        <div className="glyph">◧</div>
        <p>Not enough data yet to chart.</p>
      </div>
    );
  }

  if (type === 'category-pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || '#9a9587'} />
            ))}
          </Pie>
          <Tooltip content={<CurrencyTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12.5 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'income-vs-expense-bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid stroke="#dedbd0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7268" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7268" />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12.5 }} />
          <Bar dataKey="income" name="Income" fill="#1f5c4b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#c4593a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'trend-line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid stroke="#dedbd0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7268" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7268" />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12.5 }} />
          <Line type="monotone" dataKey="income" name="Income" stroke="#1f5c4b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#c4593a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
