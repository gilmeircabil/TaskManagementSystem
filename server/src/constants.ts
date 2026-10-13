export const TASK_STATUSES = ['todo', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DUE_FILTERS = ['overdue', 'today', 'week', 'none'] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export const TASK_SORTS = [
  'created_desc',
  'created_asc',
  'due_asc',
  'due_desc',
  'priority_desc',
  'priority_asc',
] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export const AUTH_COOKIE = 'tms_token';
export const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
