import { useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api';
import { useToast } from '../context/ToastContext';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../format';
import type { Category, Project, Task, TaskInput } from '../types';
import { ConfirmDialog, Modal } from './Modal';

interface Props {
  /** null = create a new task */
  taskId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

const EMPTY: TaskInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  project: null,
  category: null,
};

export function TaskModal({ taskId, onClose, onChanged }: Props) {
  const toast = useToast();
  const isEdit = taskId !== null;
  const [form, setForm] = useState<TaskInput>(EMPTY);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ projects: Project[] }>('/projects'),
      api<{ categories: Category[] }>('/categories'),
      taskId ? api<{ task: Task }>(`/tasks/${taskId}`) : Promise.resolve(null),
    ])
      .then(([p, c, t]) => {
        if (cancelled) return;
        setProjects(p.projects);
        setCategories(c.categories);
        if (t) {
          setForm({
            title: t.task.title,
            description: t.task.description,
            status: t.task.status,
            priority: t.task.priority,
            dueDate: t.task.dueDate,
            project: t.task.project?.id ?? null,
            category: t.task.category?.id ?? null,
          });
        }
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, title: form.title.trim(), description: form.description.trim() };
      if (isEdit) {
        await api(`/tasks/${taskId}`, { method: 'PATCH', body });
        toast('Task updated');
      } else {
        await api('/tasks', { method: 'POST', body });
        toast('Task created');
      }
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/tasks/${taskId}`, { method: 'DELETE' });
      toast('Task deleted');
      onChanged();
      onClose();
    } catch (err) {
      toast(errorMessage(err), 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (confirmDelete) {
    return (
      <ConfirmDialog
        title="Delete task?"
        message={
          <>
            “{form.title}” will be permanently deleted. This can’t be undone.
          </>
        }
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    );
  }

  return (
    <Modal
      title={isEdit ? 'Edit Task' : 'Add Task'}
      onClose={onClose}
      footer={
        !loading &&
        !loadError && (
          <>
            {isEdit && (
              <button
                type="button"
                className="btn btn-danger-ghost mr-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </>
        )
      }
    >
      {loading ? (
        <div className="muted center pad">Loading…</div>
      ) : loadError ? (
        <div className="alert alert-error">{loadError}</div>
      ) : (
        <form id="task-form" className="form" onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert-error">{error}</div>}
          <label className="field">
            <span>Title *</span>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={200}
              placeholder="What needs to be done?"
              required
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={5000}
              rows={3}
              placeholder="Add details (optional)"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => set('status', e.target.value as TaskInput['status'])}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value as TaskInput['priority'])}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Due date</span>
            <div className="input-with-action">
              <input type="date" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || null)} />
              {form.dueDate && (
                <button type="button" className="btn btn-link" onClick={() => set('dueDate', null)}>
                  Clear
                </button>
              )}
            </div>
          </label>
          <div className="field-row">
            <label className="field">
              <span>Project</span>
              <select value={form.project ?? ''} onChange={(e) => set('project', e.target.value || null)}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <select value={form.category ?? ''} onChange={(e) => set('category', e.target.value || null)}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
      )}
    </Modal>
  );
}
