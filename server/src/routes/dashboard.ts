import { Router } from 'express';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { dateContextFor, overdueFilter } from '../utils/dates.js';
import { serializeTask, type TaskLike } from '../utils/serializeTask.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (req, res) => {
  const userId = authUserId(req);
  const ctx = dateContextFor(req);

  const [statusCounts, overdue, completedThisWeek, upcoming] = await Promise.all([
    Task.aggregate<{ _id: string; n: number }>([
      { $match: { user: userId } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]),
    // Same overdue definition as the task list "overdue" filter.
    Task.countDocuments({ user: userId, ...overdueFilter(ctx) }),
    Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: ctx.weekStartInstant } }),
    Task.find({ user: userId, status: { $ne: 'completed' as const }, dueDate: { $gte: ctx.todayStart } })
      .sort({ dueDate: 1, createdAt: 1 })
      .limit(5)
      .populate('project', 'name')
      .populate('category', 'name color')
      .lean<TaskLike[]>(),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.n])) as Record<string, number>;
  const todo = byStatus.todo ?? 0;
  const inProgress = byStatus.in_progress ?? 0;
  const completed = byStatus.completed ?? 0;
  const total = todo + inProgress + completed;

  res.json({
    total,
    todo,
    inProgress,
    completed,
    overdue,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    completedThisWeek,
    upcoming: upcoming.map((t) => serializeTask(t, ctx)),
  });
});
