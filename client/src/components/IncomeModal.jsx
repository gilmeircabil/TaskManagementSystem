import React from 'react';
import IncomeForm from './IncomeForm';

export default function IncomeModal({ open, onClose, onSubmit, initialValue, submitting }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialValue ? 'Edit Income' : 'Add Income'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <IncomeForm
          initialValue={initialValue}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
