export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type DueFilter = 'overdue' | 'today' | 'week' | 'none';
export type TaskSort = 'created_desc' | 'created_asc' | 'due_asc' | 'due_desc' | 'priority_desc' | 'priority_asc';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RefSummary {
  id: string;
  name: string;
  color?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  /** "YYYY-MM-DD" calendar date */
  dueDate: string | null;
  project: RefSummary | null;
  category: RefSummary | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Computed on the server */
  isOverdue: boolean;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  taskCount: number;
}

export interface Category {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  taskCount: number;
}

export interface DashboardStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
  completedThisWeek: number;
  upcoming: Task[];
}

export interface NotificationItem {
  taskId: string;
  title: string;
  dueDate: string;
  priority: Priority;
  type: 'overdue' | 'due_today' | 'due_tomorrow';
}

export interface NotificationsResponse {
  count: number;
  items: NotificationItem[];
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  project: string | null;
  category: string | null;
}
