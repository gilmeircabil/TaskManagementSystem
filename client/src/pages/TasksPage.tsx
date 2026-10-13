import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { PrioritySelect, StatusSelect } from '../components/Badges';
import { IconFilter, IconPlus, IconSearch } from '../components/Icons';
import { ConfirmDialog } from '../components/Modal';
import { RowMenu } from '../components/RowMenu';
import { useTaskUi } from '../context/TaskUiContext';
import { useToast } from '../context/ToastContext';
import { DUE_LABELS, PRIORITIES, PRIORITY_LABELS, SORT_LABELS, STATUSES, STATUS_LABELS, formatDate } from '../format';
import type { Category, DueFilter, Project, Task, TaskInput, TaskListResponse, TaskSort } from '../types';

const PAGE_SIZE = 10;
const FILTER_KEYS = ['status', 'priority', 'project', 'category', 'due'] as const;

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const { version, notifyChanged, openCreate, openEdit } = useTaskUi();
  const toast = useToast();

  // All list state lives in the URL so filters survive refresh and are linkable.
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  const project = params.get('project') ?? '';
  const category = params.get('category') ?? '';
  const due = params.get('due') ?? '';
  const sort = (params.get('sort') as TaskSort | null) ?? 'created_desc';
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(q);
  const [showFilters, setShowFilters] = useState(() => FILTER_KEYS.some((k) => params.get(k)));
  const [data, setData] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Debounced server-side search.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (searchInput.trim() !== q) updateParams({ q: searchInput.trim() || null });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    Promise.all([api<{ projects: Project[] }>('/projects'), api<{ categories: Category[] }>('/categories')])
      .then(([p, c]) => {
        setProjects(p.projects);
        setCategories(c.categories);
      })
      .catch(() => {
        /* filter dropdowns just stay empty */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<TaskListResponse>('/tasks', {
      query: { q, status, priority, project, category, due, sort, page, limit: PAGE_SIZE },
    })
      .then((d) => {
        if (cancelled) return;
        // e.g. the last item on the last page was deleted -> step back a page
        if (d.items.length === 0 && d.total > 0 && page > d.totalPages) {
          updateParams({ page: String(d.totalPages) }, false);
          return;
        }
        setData(d);
        setError(null);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, status, priority, project, category, due, sort, page, version, updateParams]);

  async function patchTask(task: Task, changes: Partial<TaskInput>) {
    if (updatingIds.has(task.id)) return;
    setUpdatingIds((prev) => new Set(prev).add(task.id));
    // Optimistic update so the inline dropdown reflects the change instantly.
    setData((d) => d && { ...d, items: d.items.map((t) => (t.id === task.id ? { ...t, ...changes } as Task : t)) });
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: changes });
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      notifyChanged(); // refetch list (server recomputes overdue etc.), dashboard and bell
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/tasks/${toDelete.id}`, { method: 'DELETE' });
      toast('Task deleted');
      notifyChanged();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const activeFilterCount = FILTER_KEYS.filter((k) => params.get(k)).length;
  const clearAll = () => {
    setSearchInput('');
    updateParams({ q: null, status: null, priority: null, project: null, category: null, due: null });
  };

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search-box">
          <IconSearch size={16} />
          <input
            type="search"
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
        <button
          type="button"
          className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
        >
          <IconFilter size={16} /> Filters
          {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
        </button>
        <select className="sort-select" value={sort} onChange={(e) => updateParams({ sort: e.target.value })} aria-label="Sort by">
          {(Object.keys(SORT_LABELS) as TaskSort[]).map((s) => (
            <option key={s} value={s}>
              Sort: {SORT_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary toolbar-add" onClick={openCreate}>
          <IconPlus size={16} /> Add Task
        </button>
      </div>

      {showFilters && (
        <div className="card filter-panel">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => updateParams({ status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select value={priority} onChange={(e) => updateParams({ priority: e.target.value })}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Project</span>
            <select value={project} onChange={(e) => updateParams({ project: e.target.value })}>
              <option value="">All projects</option>
              <option value="none">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => updateParams({ category: e.target.value })}>
              <option value="">All categories</option>
              <option value="none">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <select value={due} onChange={(e) => updateParams({ due: e.target.value })}>
              <option value="">Any time</option>
              {(Object.keys(DUE_LABELS) as DueFilter[]).map((d) => (
                <option key={d} value={d}>
                  {DUE_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button type="button" className="btn btn-link" onClick={clearAll} disabled={activeFilterCount === 0 && !q}>
              Clear all
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}{' '}
          <button type="button" className="btn btn-link" onClick={clearAll}>
            Reset filters
          </button>
        </div>
      )}

      <div className="card table-card">
        <div className="table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                <th className="col-check" aria-label="Completed" />
                <th>Task Name</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="col-actions" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((t) => (
                <tr key={t.id} className={t.status === 'completed' ? 'row-done' : ''} data-testid="task-row">
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      disabled={updatingIds.has(t.id)}
                      onChange={(e) => patchTask(t, { status: e.target.checked ? 'completed' : 'todo' })}
                      aria-label={t.status === 'completed' ? `Mark “${t.title}” as not completed` : `Mark “${t.title}” as completed`}
                      title={t.status === 'completed' ? 'Mark as not completed' : 'Mark as completed'}
                    />
                  </td>
                  <td className="col-title" data-label="Task">
                    <button type="button" className="task-title-btn" onClick={() => openEdit(t.id)}>
                      {t.title}
                    </button>
                    {t.category && (
                      <span className="category-chip">
                        <span className="dot" style={{ background: t.category.color ?? '#94a3b8' }} />
                        {t.category.name}
                      </span>
                    )}
                  </td>
                  <td data-label="Project">{t.project?.name ?? <span className="muted">—</span>}</td>
                  <td data-label="Priority">
                    <PrioritySelect
                      value={t.priority}
                      onChange={(p) => patchTask(t, { priority: p })}
                      label={`Priority for ${t.title}`}
                    />
                  </td>
                  <td data-label="Status">
                    <StatusSelect value={t.status} onChange={(s) => patchTask(t, { status: s })} label={`Status for ${t.title}`} />
                  </td>
                  <td data-label="Due">
                    <span className={t.isOverdue ? 'text-danger strong' : ''}>{formatDate(t.dueDate)}</span>
                    {t.isOverdue && <span className="badge badge-overdue">Overdue</span>}
                  </td>
                  <td className="col-actions">
                    <RowMenu
                      label={`Actions for ${t.title}`}
                      actions={[
                        { label: 'Edit', onClick: () => openEdit(t.id) },
                        {
                          label: t.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed',
                          onClick: () => patchTask(t, { status: t.status === 'completed' ? 'todo' : 'completed' }),
                        },
                        { label: 'Delete', danger: true, onClick: () => setToDelete(t) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 && (
            <div className="empty-state">
              {q || activeFilterCount > 0 ? (
                <>
                  <p>No tasks match your search or filters.</p>
                  <button type="button" className="btn btn-secondary" onClick={clearAll}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p>No tasks yet. Create your first one!</p>
                  <button type="button" className="btn btn-primary" onClick={openCreate}>
                    <IconPlus size={16} /> Add Task
                  </button>
                </>
              )}
            </div>
          )}
          {!data && loading && <div className="muted center pad">Loading…</div>}
        </div>

        <div className="table-footer">
          <span className="muted small" data-testid="showing-label">
            Showing {from}–{to} of {total} tasks
          </span>
          <div className="pager">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) }, false)}
            >
              Previous
            </button>
            <span className="small">
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) }, false)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete task?"
          message={<>“{toDelete.title}” will be permanently deleted. This can’t be undone.</>}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
