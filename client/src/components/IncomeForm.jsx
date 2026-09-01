import React, { useState, useEffect } from 'react';
import { INCOME_SOURCES } from '../utils/constants';
import { todayISO } from '../utils/format';

const EMPTY = {
  source: INCOME_SOURCES[0],
  amount: '',
  description: '',
  date: todayISO(),
};

export default function IncomeForm({ initialValue, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValue) {
      setForm({
        source: initialValue.source || INCOME_SOURCES[0],
        amount: initialValue.amount ?? '',
        description: initialValue.description || '',
        date: initialValue.date || todayISO(),
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
    if (!form.source.trim()) next.source = 'Source is required';
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
      <div className="form-row">
        <div className="field">
          <label htmlFor="source">Source</label>
          <select id="source" name="source" value={form.source} onChange={handleChange}>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
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
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
        {errors.date && <div className="hint">{errors.date}</div>}
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
          {submitting ? 'Saving…' : initialValue ? 'Save Changes' : 'Add Income'}
        </button>
      </div>
    </form>
  );
}
