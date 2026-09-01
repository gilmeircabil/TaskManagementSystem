import React from 'react';
import { formatCurrency } from '../utils/format';

export default function BalanceCard({ totalIncome, totalExpenses, currency }) {
  const balance = totalIncome - totalExpenses;

  return (
    <div className="summary-grid">
      <div className="summary-card income">
        <div className="label">
          <span className="icon-badge income">+</span> Total Income
        </div>
        <div className="value">{formatCurrency(totalIncome, currency)}</div>
        <div className="sub-note">All recorded income</div>
      </div>

      <div className="summary-card expense">
        <div className="label">
          <span className="icon-badge expense">−</span> Total Expenses
        </div>
        <div className="value">{formatCurrency(totalExpenses, currency)}</div>
        <div className="sub-note">All recorded expenses</div>
      </div>

      <div className="summary-card balance">
        <div className="label">
          <span className="icon-badge balance">₱</span> Current Balance
        </div>
        <div className="value" style={{ color: balance >= 0 ? 'var(--forest-dark)' : 'var(--rust)' }}>
          {formatCurrency(balance, currency)}
        </div>
        <div className="sub-note">{balance >= 0 ? 'You are in the green' : 'Spending exceeds income'}</div>
      </div>
    </div>
  );
}
