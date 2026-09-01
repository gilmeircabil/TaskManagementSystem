import React from 'react';
import { formatDate, formatCurrency } from '../utils/format';

export default function ExpenseCard({ expense, currency, onEdit, onDelete }) {
  return (
    <div className="item-card">
      <div className="item-card-top">
        <div>
          <div className="item-title">{expense.title}</div>
          <span className="tag">{expense.category}</span>
        </div>
        <div className="item-amount expense">−{formatCurrency(expense.amount, currency)}</div>
      </div>

      {expense.description && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{expense.description}</div>
      )}

      <div className="item-card-meta">
        <span>{formatDate(expense.date)}</span>
        <span>{expense.payment_method || '—'}</span>
      </div>

      <div className="item-card-actions">
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(expense)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(expense)}>
          Delete
        </button>
      </div>
    </div>
  );
}
