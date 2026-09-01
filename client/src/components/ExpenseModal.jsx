import React from 'react';
import ExpenseForm from './ExpenseForm';

export default function ExpenseModal({ open, onClose, onSubmit, initialValue, submitting }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialValue ? 'Edit Expense' : 'Add Expense'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <ExpenseForm
          initialValue={initialValue}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
