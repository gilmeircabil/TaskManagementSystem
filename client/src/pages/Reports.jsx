import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import Chart from '../components/Chart.jsx';
import { formatCurrency, formatDateShort } from '../utils/format';
import { exportTransactionsCSV, exportTransactionsPDF } from '../utils/exportReports';

const RANGE_OPTIONS = [
  { key: 'daily', label: 'Daily', days: 7 },
  { key: 'weekly', label: 'Weekly', days: 56 },
  { key: 'monthly', label: 'Monthly', days: 365 },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function bucketKey(dateStr, mode) {
  const d = new Date(dateStr);
  if (mode === 'daily') {
    return d.toISOString().slice(0, 10);
  }
  if (mode === 'weekly') {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Reports() {
  const { profile } = useAuth();
  const { expenses, loading: loadingExpenses } = useExpenses();
  const { income, loading: loadingIncome } = useIncome();
  const [range, setRange] = useState('weekly');

  const currency = profile?.currency || 'PHP';
  const loading = loadingExpenses || loadingIncome;
  const activeRange = RANGE_OPTIONS.find((r) => r.key === range);

  const cutoffDate = useMemo(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - activeRange.days);
    return d;
  }, [activeRange]);

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date) >= cutoffDate),
    [expenses, cutoffDate]
  );
  const filteredIncome = useMemo(
    () => income.filter((i) => new Date(i.date) >= cutoffDate),
    [income, cutoffDate]
  );

  const totalIncome = filteredIncome.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const trendData = useMemo(() => {
    const buckets = {};
    filteredExpenses.forEach((e) => {
      const key = bucketKey(e.date, range);
      buckets[key] = buckets[key] || { income: 0, expenses: 0 };
      buckets[key].expenses += Number(e.amount);
    });
    filteredIncome.forEach((i) => {
      const key = bucketKey(i.date, range);
      buckets[key] = buckets[key] || { income: 0, expenses: 0 };
      buckets[key].income += Number(i.amount);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([key, val]) => ({
        label: range === 'daily' ? formatDateShort(key) : key,
        ...val,
      }))
      .slice(-14);
  }, [filteredExpenses, filteredIncome, range]);

  const combinedTransactions = useMemo(() => {
    return [
      ...filteredExpenses.map((e) => ({ ...e, type: 'expense' })),
      ...filteredIncome.map((i) => ({ ...i, type: 'income' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredExpenses, filteredIncome]);

  function handleExportCSV() {
    exportTransactionsCSV(combinedTransactions, `kupon-${range}-report.csv`);
  }

  function handleExportPDF() {
    exportTransactionsPDF({
      transactions: combinedTransactions,
      totalIncome,
      totalExpenses,
      currency,
      title: `Kupon ${activeRange.label} Report`,
      filename: `kupon-${range}-report.pdf`,
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <div className="lede">Understand your money over time.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>Export CSV</button>
          <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            className={`pill-tab ${range === r.key ? 'active' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="summary-grid">
            <div className="summary-card income">
              <div className="label"><span className="icon-badge income">+</span> Income</div>
              <div className="value">{formatCurrency(totalIncome, currency)}</div>
            </div>
            <div className="summary-card expense">
              <div className="label"><span className="icon-badge expense">−</span> Expenses</div>
              <div className="value">{formatCurrency(totalExpenses, currency)}</div>
            </div>
            <div className="summary-card balance">
              <div className="label"><span className="icon-badge balance">₱</span> Net</div>
              <div className="value" style={{ color: totalIncome - totalExpenses >= 0 ? 'var(--forest-dark)' : 'var(--rust)' }}>
                {formatCurrency(totalIncome - totalExpenses, currency)}
              </div>
            </div>
          </div>

          <div className="two-col">
            <div className="panel">
              <div className="panel-title">Income vs Expenses</div>
              <div className="panel-sub">{activeRange.label} comparison over recent periods</div>
              <Chart type="income-vs-expense-bar" data={trendData} />
            </div>

            <div className="panel">
              <div className="panel-title">Category Breakdown</div>
              <div className="panel-sub">Where your expenses went</div>
              <Chart type="category-pie" data={categoryBreakdown} height={240} />
            </div>
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <div className="panel-title">Spending Trend</div>
            <div className="panel-sub">Income vs expenses over time</div>
            <Chart type="trend-line" data={trendData} />
          </div>
        </>
      )}
    </div>
  );
}
