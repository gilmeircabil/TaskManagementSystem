import React from 'react';
import { formatDate, formatCurrency } from '../utils/format';

export default function IncomeCard({ income, currency, onEdit, onDelete }) {
  return (
    <div className="item-card">
      <div className="item-card-top">
        <div>
          <div className="item-title">{income.source}</div>
          <span className="tag">Income</span>
        </div>
        <div className="item-amount income">+{formatCurrency(income.amount, currency)}</div>
      </div>

      {income.description && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{income.description}</div>
      )}

      <div className="item-card-meta">
        <span>{formatDate(income.date)}</span>
      </div>

      <div className="item-card-actions">
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(income)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(income)}>
          Delete
        </button>
      </div>
    </div>
  );
}
