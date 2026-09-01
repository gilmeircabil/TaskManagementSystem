import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIncome } from '../hooks/useIncome';
import IncomeCard from '../components/IncomeCard.jsx';
import IncomeModal from '../components/IncomeModal.jsx';
import toast from 'react-hot-toast';

export default function Income() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({});
  const { income, loading, addIncome, editIncome, removeIncome } = useIncome(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currency = profile?.currency || 'PHP';

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing) {
        await editIncome(editing.id, payload);
      } else {
        await addIncome(payload);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete income from "${item.source}"?`)) return;
    try {
      await removeIncome(item.id);
    } catch (err) {
      toast.error(err.message || 'Could not delete income');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Income</h1>
          <div className="lede">Track every peso coming in.</div>
        </div>
        <button className="btn btn-gold" onClick={openAdd}>+ Add Income</button>
      </div>

      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            placeholder="Search by source..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="startDate">From</label>
          <input
            id="startDate"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="endDate">To</label>
          <input
            id="endDate"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({})} type="button">
          Reset
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : income.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">+</div>
          <p>No income recorded yet.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add your first income</button>
        </div>
      ) : (
        <div className="item-grid">
          {income.map((item) => (
            <IncomeCard
              key={item.id}
              income={item}
              currency={currency}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <IncomeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValue={editing}
        submitting={submitting}
      />
    </div>
  );
}
