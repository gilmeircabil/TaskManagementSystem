import type { DueFilter, Priority, TaskSort, TaskStatus } from './types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const DUE_LABELS: Record<DueFilter, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  week: 'Due this week',
  none: 'No due date',
};

export const SORT_LABELS: Record<TaskSort, string> = {
  created_desc: 'Newest first',
  created_asc: 'Oldest first',
  due_asc: 'Due date (soonest)',
  due_desc: 'Due date (latest)',
  priority_desc: 'Priority (high → low)',
  priority_asc: 'Priority (low → high)',
};

export const STATUSES = Object.keys(STATUS_LABELS) as TaskStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];

/** Format a "YYYY-MM-DD" calendar date for display (no timezone shifting). */
export function formatDate(value: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}
