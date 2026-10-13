import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { TaskModal } from '../components/TaskModal';

interface TaskUiValue {
  /** Increments after any task mutation; data views refetch when it changes. */
  version: number;
  notifyChanged: () => void;
  openCreate: () => void;
  openEdit: (taskId: string) => void;
}

const TaskUiContext = createContext<TaskUiValue | null>(null);

type ModalState = { mode: 'create' } | { mode: 'edit'; taskId: string } | null;

/**
 * Hosts the single Add/Edit Task modal so the dashboard, task table and
 * notification bell can all open it, and broadcasts a "tasks changed" signal
 * so stat cards, lists and reminders refresh immediately.
 */
export function TaskUiProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);

  const notifyChanged = useCallback(() => setVersion((v) => v + 1), []);
  const openCreate = useCallback(() => setModal({ mode: 'create' }), []);
  const openEdit = useCallback((taskId: string) => setModal({ mode: 'edit', taskId }), []);

  const value = useMemo(
    () => ({ version, notifyChanged, openCreate, openEdit }),
    [version, notifyChanged, openCreate, openEdit],
  );

  return (
    <TaskUiContext.Provider value={value}>
      {children}
      {modal && (
        <TaskModal
          key={modal.mode === 'edit' ? modal.taskId : 'new'}
          taskId={modal.mode === 'edit' ? modal.taskId : null}
          onClose={() => setModal(null)}
          onChanged={notifyChanged}
        />
      )}
    </TaskUiContext.Provider>
  );
}

export function useTaskUi() {
  const ctx = useContext(TaskUiContext);
  if (!ctx) throw new Error('useTaskUi must be used inside TaskUiProvider');
  return ctx;
}
