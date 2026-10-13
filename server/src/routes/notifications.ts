import { Router } from 'express';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { dateContextFor, formatDateOnly } from '../utils/dates.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

const MAX_ITEMS = 50;

/**
 * Reminders are generated on demand from task data (no cron/email/push).
 * Included: non-completed tasks that are overdue, or due within the next 48 hours.
 * Since due dates are calendar dates, "within 48 hours" means due today or tomorrow.
 */
notificationsRouter.get('/', async (req, res) => {
  const userId = authUserId(req);
  const ctx = dateContextFor(req);
  const filter = {
    user: userId,
    status: { $ne: 'completed' as const },
    dueDate: { $ne: null, $lt: ctx.dayAfterTomorrowStart },
  };

  const [count, tasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter).sort({ dueDate: 1, createdAt: 1 }).limit(MAX_ITEMS).select('title dueDate priority status').lean(),
  ]);

  const items = tasks.map((t) => {
    const due = t.dueDate!.getTime();
    const type =
      due < ctx.todayStart.getTime() ? 'overdue' : due < ctx.tomorrowStart.getTime() ? 'due_today' : 'due_tomorrow';
    return {
      taskId: t._id.toString(),
      title: t.title,
      dueDate: formatDateOnly(t.dueDate),
      priority: t.priority,
      type,
    };
  });

  res.json({ count, items });
});
