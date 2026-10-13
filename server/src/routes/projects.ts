import { Router } from 'express';
import type { Types } from 'mongoose';
import { z } from 'zod';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { Project, serializeProject } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { idParams } from '../utils/validation.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

const createBody = z.strictObject({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(1000).optional(),
});
const updateBody = createBody
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'No fields to update' });

async function taskCount(userId: Types.ObjectId, projectId: Types.ObjectId) {
  return Task.countDocuments({ user: userId, project: projectId });
}

projectsRouter.get('/', async (req, res) => {
  const userId = authUserId(req);
  const [projects, counts] = await Promise.all([
    Project.find({ user: userId }).sort({ name: 1 }).collation({ locale: 'en', strength: 2 }).lean(),
    Task.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { user: userId, project: { $ne: null } } },
      { $group: { _id: '$project', n: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.n]));
  res.json({ projects: projects.map((p) => serializeProject(p, countMap.get(p._id.toString()) ?? 0)) });
});

projectsRouter.post('/', async (req, res) => {
  const userId = authUserId(req);
  const body = createBody.parse(req.body);
  const project = await Project.create({ user: userId, name: body.name, description: body.description ?? '' });
  res.status(201).json({ project: serializeProject(project, 0) });
});

projectsRouter.patch('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);
  const body = updateBody.parse(req.body);

  const project = await Project.findOne({ _id: id, user: userId });
  if (!project) throw new HttpError(404, 'Project not found');
  if (body.name !== undefined) project.name = body.name;
  if (body.description !== undefined) project.description = body.description;
  await project.save();

  res.json({ project: serializeProject(project, await taskCount(userId, id)) });
});

projectsRouter.delete('/:id', async (req, res) => {
  const userId = authUserId(req);
  const { id } = idParams.parse(req.params);

  const project = await Project.findOne({ _id: id, user: userId });
  if (!project) throw new HttpError(404, 'Project not found');

  // Deleting a project never deletes tasks — it only unassigns them.
  const { modifiedCount } = await Task.updateMany({ user: userId, project: id }, { $set: { project: null } });
  await Project.deleteOne({ _id: id, user: userId });

  res.json({ deleted: true, unassignedTasks: modifiedCount });
});
