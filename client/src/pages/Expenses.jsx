import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import ExpenseCard from '../components/ExpenseCard.jsx';
import ExpenseModal from '../components/ExpenseModal.jsx';
import ExpenseFilter from '../components/ExpenseFilter.jsx';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({});
  const { expenses, loading, addExpense, editExpense, removeExpense } = useExpenses(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currency = profile?.currency || 'PHP';

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(expense) {
    setEditing(expense);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (editing) {
        await editExpense(editing.id, payload);
      } else {
        await addExpense(payload);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    try {
      await removeExpense(expense.id);
    } catch (err) {
      toast.error(err.message || 'Could not delete expense');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <div className="lede">Log and manage everything you spend.</div>
        </div>
        <button className="btn btn-gold" onClick={openAdd}>+ Add Expense</button>
      </div>

      <ExpenseFilter filters={filters} onChange={setFilters} onReset={() => setFilters({})} />

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">−</div>
          <p>No expenses match your filters yet.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add your first expense</button>
        </div>
      ) : (
        <div className="item-grid">
          {expenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              currency={currency}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValue={editing}
        submitting={submitting}
      />
    </div>
  );
}
