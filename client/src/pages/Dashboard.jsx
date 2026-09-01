import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { useIncome } from '../hooks/useIncome';
import BalanceCard from '../components/BalanceCard.jsx';
import Chart from '../components/Chart.jsx';
import { formatCurrency, formatDate, getGreeting } from '../utils/format';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { expenses, loading: loadingExpenses } = useExpenses();
  const { income, loading: loadingIncome } = useIncome();

  const currency = profile?.currency || 'PHP';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there';

  const totalIncome = useMemo(() => income.reduce((sum, i) => sum + Number(i.amount), 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);

  const categoryData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const recentTransactions = useMemo(() => {
    const combined = [
      ...expenses.map((e) => ({ ...e, type: 'expense', label: e.title })),
      ...income.map((i) => ({ ...i, type: 'income', label: i.source })),
    ];
    return combined
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);
  }, [expenses, income]);

  const loading = loadingExpenses || loadingIncome;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{getGreeting()}, {displayName}</h1>
          <div className="lede">Here's how your money is moving.</div>
        </div>
        <Link to="/expenses" className="btn btn-gold">+ Add Expense</Link>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <BalanceCard totalIncome={totalIncome} totalExpenses={totalExpenses} currency={currency} />

          <div className="two-col">
            <div className="panel">
              <div className="panel-title">Spending Overview</div>
              <div className="panel-sub">Breakdown of expenses by category</div>
              <Chart type="category-pie" data={categoryData} />
            </div>

            <div className="panel">
              <div className="panel-title">Recent Transactions</div>
              <div className="panel-sub">Your latest activity</div>
              {recentTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="glyph">₱</div>
                  <p>No transactions yet. Add your first expense or income.</p>
                </div>
              ) : (
                <div>
                  {recentTransactions.map((t) => (
                    <div className="tx-row" key={`${t.type}-${t.id}`}>
                      <div className="tx-left">
                        <div className={`tx-dot ${t.type}`}>{t.type === 'expense' ? '−' : '+'}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="tx-title">{t.label}</div>
                          <div className="tx-meta">{formatDate(t.date)}</div>
                        </div>
                      </div>
                      <div className={`tx-amount ${t.type}`}>
                        {t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <Link to="/transactions" className="btn btn-outline btn-sm">View all transactions</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
