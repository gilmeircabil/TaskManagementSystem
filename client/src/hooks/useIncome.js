import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as incomeService from '../services/incomeService';

export function useIncome(filters = {}) {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incomeService.fetchIncome(JSON.parse(filterKey));
      setIncome(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load income');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addIncome = useCallback(async (payload) => {
    const created = await incomeService.createIncome(payload);
    setIncome((prev) => [created, ...prev]);
    toast.success('Income added');
    return created;
  }, []);

  const editIncome = useCallback(async (id, payload) => {
    const updated = await incomeService.updateIncome(id, payload);
    setIncome((prev) => prev.map((i) => (i.id === id ? updated : i)));
    toast.success('Income updated');
    return updated;
  }, []);

  const removeIncome = useCallback(async (id) => {
    await incomeService.deleteIncome(id);
    setIncome((prev) => prev.filter((i) => i.id !== id));
    toast.success('Income deleted');
  }, []);

  return { income, loading, error, refresh, addIncome, editIncome, removeIncome };
}
