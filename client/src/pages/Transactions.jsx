import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import { formatCurrency, formatDate } from '../utils/format';

export default function Transactions() {
  const { profile } = useAuth();
  const { expenses, loading: loadingExpenses } = useExpenses();
  const { income, loading: loadingIncome } = useIncome();
  const [typeFilter, setTypeFilter] = useState('all');

  const currency = profile?.currency || 'PHP';
  const loading = loadingExpenses || loadingIncome;

  const combined = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ ...e, type: 'expense', label: e.title, meta: e.category })),
      ...income.map((i) => ({ ...i, type: 'income', label: i.source, meta: 'Income' })),
    ];
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, income]);

  const filtered = typeFilter === 'all' ? combined : combined.filter((t) => t.type === typeFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <div className="lede">Every expense and income entry, in one place.</div>
        </div>
        <div className="pill-tabs">
          {['all', 'income', 'expense'].map((t) => (
            <button
              key={t}
              className={`pill-tab ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">≡</div>
            <p>No transactions to show.</p>
          </div>
        ) : (
          <table className="table-simple">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category / Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={`${t.type}-${t.id}`}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.label}</td>
                  <td><span className="tag">{t.meta}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600, color: t.type === 'expense' ? 'var(--rust)' : 'var(--forest-light)' }}>
                    {t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
