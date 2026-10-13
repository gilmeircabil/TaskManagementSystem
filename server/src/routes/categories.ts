import { Router } from 'express';
import type { Types } from 'mongoose';
import { z } from 'zod';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { Category, serializeCategory } from '../models/Category.js';
import { Task } from '../models/Task.js';
import { idParams } from '../utils/validation.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

const CATEGORY_COLLATION = { locale: 'en', strength: 2 } as const;

const createBody = z.strictObject({
  name: z.string().trim().min(1, 'Name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #3b82f6')
    .nullable()
    .optional(),
});
const updateBody = createBody
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' });

async function assertNameAvailable(userId: Types.ObjectId, name: string, exceptId?: Types.ObjectId) {
  const filter: Record<string, unknown> = { user: userId, name };
  if (exceptId) filter._id = { $ne: exceptId };
  const clash = await Category.findOne(filter).collation(CATEGORY_COLLATION).select('_id').lean();
  if (clash) throw new HttpError(409, 'A category with this name already exists');
}

categoriesRouter.get('/', async (req, res) => {
  const userId = authUserId(req);
  const [categories, counts] = await Promise.all([
    Category.find({ user: userId }).sort({ name: 1 }).collation(CATEGORY_COLLATION).lean(),
    Task.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { user: userId, category: { $ne: null } } },
      { $group: { _id: '$category', n: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.n]));
  res.json({ categories: categories.map((c) => serializeCategory(c, countMap.get(c._id.toString()) ?? 0)) });
});

categoriesRouter.post('/', async (req, res) => {
  const userId = authUserId(req);
  const body = createBody.parse(req.body);
  await assertNameAvailable(userId, body.name);
  const category = await Category.create({ user: userId, name: body.name, color: body.color ?? null });
  res.status(201).json({ category: serializeCategory(category, 0) });
});

categoriesRouter.patch('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);
  const body = updateBody.parse(req.body);

  const category = await Category.findOne({ _id: id, user: userId });
  if (!category) throw new HttpError(404, 'Category not found');
  if (body.name !== undefined) {
    await assertNameAvailable(userId, body.name, id);
    category.name = body.name;
  }
  if (body.color !== undefined) category.color = body.color;
  await category.save();

  const count = await Task.countDocuments({ user: userId, category: id });
  res.json({ category: serializeCategory(category, count) });
});

categoriesRouter.delete('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);

  const category = await Category.findOne({ _id: id, user: userId });
  if (!category) throw new HttpError(404, 'Category not found');

  // Deleting a category never deletes tasks — it only unassigns them.
  const { modifiedCount } = await Task.updateMany({ user: userId, category: id }, { $set: { category: null } });
  await Category.deleteOne({ _id: id, user: userId });

  res.json({ deleted: true, unassignedTasks: modifiedCount });
});
