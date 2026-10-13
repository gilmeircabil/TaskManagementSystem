import { Router } from 'express';
import type { PipelineStage, Types } from 'mongoose';
import { z } from 'zod';
import { DUE_FILTERS, PRIORITIES, TASK_SORTS, TASK_STATUSES, type TaskSort } from '../constants.js';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { Category } from '../models/Category.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { dateContextFor, overdueFilter, type DateContext } from '../utils/dates.js';
import { serializeTask, type TaskLike } from '../utils/serializeTask.js';
import { dateOnly, escapeRegex, idParams, objectId } from '../utils/validation.js';

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

// ---------- Schemas ----------

const listQuery = z.strictObject({
  q: z.string().trim().max(100).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  project: z.union([z.literal('none'), objectId]).optional(),
  category: z.union([z.literal('none'), objectId]).optional(),
  due: z.enum(DUE_FILTERS).optional(),
  sort: z.enum(TASK_SORTS).default('created_desc'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const taskFields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  dueDate: dateOnly.nullable(),
  project: objectId.nullable(),
  category: objectId.nullable(),
};

const createBody = z.strictObject({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  priority: taskFields.priority.optional(),
  dueDate: taskFields.dueDate.optional(),
  project: taskFields.project.optional(),
  category: taskFields.category.optional(),
});

const updateBody = createBody
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' });

// ---------- Helpers ----------

/** Make sure referenced project/category belong to the same user. */
async function assertRefsOwned(
  userId: Types.ObjectId,
  refs: { project?: Types.ObjectId | null; category?: Types.ObjectId | null },
) {
  if (refs.project && !(await Project.exists({ _id: refs.project, user: userId }))) {
    throw new HttpError(400, 'Project not found');
  }
  if (refs.category && !(await Category.exists({ _id: refs.category, user: userId }))) {
    throw new HttpError(400, 'Category not found');
  }
}

async function loadTask(userId: Types.ObjectId, id: Types.ObjectId) {
  return Task.findOne({ _id: id, user: userId })
    .populate('project', 'name')
    .populate('category', 'name color')
    .lean<TaskLike>();
}

function sortStages(sort: TaskSort): PipelineStage[] {
  switch (sort) {
    case 'created_asc':
      return [{ $sort: { createdAt: 1, _id: 1 } }];
    case 'due_asc':
    case 'due_desc':
      return [
        // Tasks without a due date always go last.
        { $addFields: { _noDue: { $cond: [{ $eq: [{ $ifNull: ['$dueDate', null] }, null] }, 1, 0] } } },
        { $sort: { _noDue: 1, dueDate: sort === 'due_asc' ? 1 : -1, createdAt: -1, _id: -1 } },
      ];
    case 'priority_desc':
    case 'priority_asc':
      return [
        {
          $addFields: {
            _priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'high'] }, then: 3 },
                  { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                ],
                default: 1,
              },
            },
          },
        },
        { $sort: { _priorityRank: sort === 'priority_desc' ? -1 : 1, createdAt: -1, _id: -1 } },
      ];
    case 'created_desc':
    default:
      return [{ $sort: { createdAt: -1, _id: -1 } }];
  }
}

function dueConditions(due: z.infer<typeof listQuery>['due'], ctx: DateContext): Record<string, unknown>[] {
  switch (due) {
    case 'overdue':
      return [overdueFilter(ctx)];
    case 'today':
      return [{ dueDate: { $gte: ctx.todayStart, $lt: ctx.tomorrowStart } }];
    case 'week':
      return [{ dueDate: { $gte: ctx.weekStart, $lt: ctx.weekEnd } }];
    case 'none':
      return [{ dueDate: null }];
    default:
      return [];
  }
}

// ---------- Routes ----------

tasksRouter.get('/', async (req, res) => {
  const userId = authUserId(req);
  const query = listQuery.parse(req.query);
  const ctx = dateContextFor(req);

  // Every filter is built from validated, typed values only — never from raw req.query.
  const conditions: Record<string, unknown>[] = [{ user: userId }];
  if (query.q) {
    const pattern = escapeRegex(query.q);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } },
      ],
    });
  }
  if (query.status) conditions.push({ status: query.status });
  if (query.priority) conditions.push({ priority: query.priority });
  if (query.project) conditions.push({ project: query.project === 'none' ? null : query.project });
  if (query.category) conditions.push({ category: query.category === 'none' ? null : query.category });
  conditions.push(...dueConditions(query.due, ctx));

  const skip = (query.page - 1) * query.limit;
  const pipeline: PipelineStage[] = [
    { $match: { $and: conditions } },
    ...sortStages(query.sort),
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: query.limit },
          {
            $lookup: {
              from: Project.collection.name,
              localField: 'project',
              foreignField: '_id',
              as: 'project',
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $lookup: {
              from: Category.collection.name,
              localField: 'category',
              foreignField: '_id',
              as: 'category',
              pipeline: [{ $project: { name: 1, color: 1 } }],
            },
          },
          { $addFields: { project: { $first: '$project' }, category: { $first: '$category' } } },
        ],
        total: [{ $count: 'n' }],
      },
    },
  ];

  const [result] = await Task.aggregate<{ items: TaskLike[]; total: { n: number }[] }>(pipeline);
  const total = result?.total[0]?.n ?? 0;

  res.json({
    items: (result?.items ?? []).map((t) => serializeTask(t, ctx)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

tasksRouter.post('/', async (req, res) => {
  const userId = authUserId(req);
  const body = createBody.parse(req.body);
  await assertRefsOwned(userId, body);

  const status = body.status ?? 'todo';
  const created = await Task.create({
    user: userId,
    title: body.title,
    description: body.description ?? '',
    status,
    priority: body.priority ?? 'medium',
    dueDate: body.dueDate ?? null,
    project: body.project ?? null,
    category: body.category ?? null,
    completedAt: status === 'completed' ? new Date() : null,
  });

  const task = await loadTask(userId, created._id);
  res.status(201).json({ task: serializeTask(task!, dateContextFor(req)) });
});

tasksRouter.get('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);
  const task = await loadTask(userId, id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ task: serializeTask(task, dateContextFor(req)) });
});

tasksRouter.patch('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);
  const body = updateBody.parse(req.body);
  await assertRefsOwned(userId, body);

  const task = await Task.findOne({ _id: id, user: userId });
  if (!task) throw new HttpError(404, 'Task not found');

  if (body.title !== undefined) task.title = body.title;
  if (body.description !== undefined) task.description = body.description;
  if (body.priority !== undefined) task.priority = body.priority;
  if (body.dueDate !== undefined) task.dueDate = body.dueDate;
  if (body.project !== undefined) task.project = body.project;
  if (body.category !== undefined) task.category = body.category;
  if (body.status !== undefined && body.status !== task.status) {
    task.status = body.status;
    // completedAt is set when a task becomes completed and cleared otherwise.
    task.completedAt = body.status === 'completed' ? new Date() : null;
  }
  await task.save();

  const updated = await loadTask(userId, id);
  res.json({ task: serializeTask(updated!, dateContextFor(req)) });
});

tasksRouter.delete('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);
  const result = await Task.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw new HttpError(404, 'Task not found');
  res.status(204).end();
});
