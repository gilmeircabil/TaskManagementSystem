import React from 'react';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';

export default function ExpenseFilter({ filters, onChange, onReset }) {
  function handleChange(e) {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  }

  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="search">Search</label>
        <input
          id="search"
          name="search"
          placeholder="Search by title..."
          value={filters.search || ''}
          onChange={handleChange}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="category">Category</label>
        <select id="category" name="category" value={filters.category || ''} onChange={handleChange}>
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="paymentMethod">Payment method</label>
        <select id="paymentMethod" name="paymentMethod" value={filters.paymentMethod || ''} onChange={handleChange}>
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="startDate">From</label>
        <input id="startDate" name="startDate" type="date" value={filters.startDate || ''} onChange={handleChange} />
      </div>

      <div className="filter-field">
        <label htmlFor="endDate">To</label>
        <input id="endDate" name="endDate" type="date" value={filters.endDate || ''} onChange={handleChange} />
      </div>

      <button className="btn btn-outline btn-sm" onClick={onReset} type="button">
        Reset
      </button>
    </div>
  );
}
