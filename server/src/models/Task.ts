import { Schema, model, type Types } from 'mongoose';
import { PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from '../constants.js';

export interface ITask {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  /** Calendar date stored as UTC midnight (date-only semantics). */
  dueDate: Date | null;
  project: Types.ObjectId | null;
  category: Types.ObjectId | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', required: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium', required: true },
    dueDate: { type: Date, default: null },
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, project: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = model<ITask>('Task', taskSchema);
