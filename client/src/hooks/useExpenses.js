import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as expenseService from '../services/expenseService';

/**
 * Encapsulates fetching + CRUD state for expenses so pages stay declarative.
 * Accepts a `filters` object ({ category, paymentMethod, startDate, endDate, search }).
 */
export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expenseService.fetchExpenses(JSON.parse(filterKey));
      setExpenses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback(async (payload) => {
    const created = await expenseService.createExpense(payload);
    setExpenses((prev) => [created, ...prev]);
    toast.success('Expense added');
    return created;
  }, []);

  const editExpense = useCallback(async (id, payload) => {
    const updated = await expenseService.updateExpense(id, payload);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    toast.success('Expense updated');
    return updated;
  }, []);

  const removeExpense = useCallback(async (id) => {
    await expenseService.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success('Expense deleted');
  }, []);

  return { expenses, loading, error, refresh, addExpense, editExpense, removeExpense };
}
