import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import { todayISO } from '../utils/format';

const EMPTY = {
  title: '',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  description: '',
  date: todayISO(),
  payment_method: PAYMENT_METHODS[0],
};

export default function ExpenseForm({ initialValue, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title || '',
        amount: initialValue.amount ?? '',
        category: initialValue.category || EXPENSE_CATEGORIES[0],
        description: initialValue.description || '',
        date: initialValue.date || todayISO(),
        payment_method: initialValue.payment_method || PAYMENT_METHODS[0],
      });
    } else {
      setForm(EMPTY);
    }
  }, [initialValue]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than 0';
    if (!form.date) next.date = 'Date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: Number(form.amount) });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Grocery run" />
        {errors.title && <div className="hint">{errors.title}</div>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="amount">Amount (₱)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
          />
          {errors.amount && <div className="hint">{errors.amount}</div>}
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
          {errors.date && <div className="hint">{errors.date}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="payment_method">Payment Method</label>
          <select id="payment_method" name="payment_method" value={form.payment_method} onChange={handleChange}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={form.description}
          onChange={handleChange}
          placeholder="Add a note..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initialValue ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}
