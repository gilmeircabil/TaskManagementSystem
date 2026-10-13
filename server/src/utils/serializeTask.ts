import { Types } from 'mongoose';
import type { ITask } from '../models/Task.js';
import { formatDateOnly, isOverdue, type DateContext } from './dates.js';

type RefLike =
  | Types.ObjectId
  | { _id: Types.ObjectId; name?: string; color?: string | null }
  | null
  | undefined;

/** A task as returned by .lean()/.populate() or by an aggregation with $lookup. */
export type TaskLike = Omit<ITask, 'project' | 'category'> & { project?: RefLike; category?: RefLike };

function serializeRef(ref: RefLike) {
  if (!ref) return null;
  if (ref instanceof Types.ObjectId) return { id: ref.toString(), name: '', color: null };
  return { id: ref._id.toString(), name: ref.name ?? '', color: ref.color ?? null };
}

export function serializeTask(task: TaskLike, ctx: DateContext) {
  const project = serializeRef(task.project);
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: formatDateOnly(task.dueDate),
    project: project ? { id: project.id, name: project.name } : null,
    category: serializeRef(task.category),
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    isOverdue: isOverdue(task, ctx),
  };
}
