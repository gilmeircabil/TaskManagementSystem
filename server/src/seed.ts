/**
 * Seeds one demo user with sample projects, categories and tasks.
 * Re-running resets the demo user's data. Run with: npm run seed
 *
 * The demo password is demo data only (not a secret). Override it with SEED_DEMO_PASSWORD.
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import type { Priority, TaskStatus } from './constants.js';
import { connectDb } from './db.js';
import { Category } from './models/Category.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';
import { User } from './models/User.js';
import { getDateContext } from './utils/dates.js';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo-password-123';
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  await connectDb();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const ctx = getDateContext(tz);
  const inDays = (n: number) => new Date(ctx.todayStart.getTime() + n * DAY);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (user) {
    await Promise.all([
      Task.deleteMany({ user: user._id }),
      Project.deleteMany({ user: user._id }),
      Category.deleteMany({ user: user._id }),
    ]);
    user.passwordHash = passwordHash;
    await user.save();
  } else {
    user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, passwordHash });
  }
  const uid = user._id;

  const [website, study, home] = await Project.create([
    { user: uid, name: 'Website Redesign', description: 'Refresh the company marketing site' },
    { user: uid, name: 'Semester Study Plan', description: 'Coursework and exam prep' },
    { user: uid, name: 'Home', description: 'Personal errands and chores' },
  ]);
  const [work, school, personal] = await Category.create([
    { user: uid, name: 'Work', color: '#3b82f6' },
    { user: uid, name: 'School', color: '#8b5cf6' },
    { user: uid, name: 'Personal', color: '#10b981' },
  ]);

  const now = new Date();
  const tasks: Array<{
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    due: number | null;
    project?: mongoose.Types.ObjectId;
    category?: mongoose.Types.ObjectId;
  }> = [
    { title: 'Draft homepage wireframes', status: 'in_progress', priority: 'high', due: 1, project: website._id, category: work._id },
    { title: 'Collect brand assets from marketing', status: 'todo', priority: 'medium', due: -2, project: website._id, category: work._id, description: 'Logos, fonts and color palette' },
    { title: 'Write copy for About page', status: 'todo', priority: 'low', due: 6, project: website._id, category: work._id },
    { title: 'Set up analytics dashboard', status: 'completed', priority: 'medium', due: -1, project: website._id, category: work._id },
    { title: 'Review pull requests', status: 'todo', priority: 'high', due: 0, category: work._id },
    { title: 'Read chapter 5 of Algorithms', status: 'in_progress', priority: 'medium', due: 3, project: study._id, category: school._id },
    { title: 'Submit lab report', status: 'todo', priority: 'high', due: -4, project: study._id, category: school._id, description: 'Physics lab #3 write-up' },
    { title: 'Prepare flashcards for midterm', status: 'todo', priority: 'medium', due: 9, project: study._id, category: school._id },
    { title: 'Email professor about project topic', status: 'completed', priority: 'low', due: null, project: study._id, category: school._id },
    { title: 'Pay electricity bill', status: 'todo', priority: 'high', due: 1, project: home._id, category: personal._id },
    { title: 'Grocery shopping', status: 'todo', priority: 'low', due: null, project: home._id, category: personal._id, description: 'Milk, eggs, vegetables, coffee' },
    { title: 'Book dentist appointment', status: 'completed', priority: 'medium', due: 2, project: home._id, category: personal._id },
  ];

  await Task.insertMany(
    tasks.map((t, i) => ({
      user: uid,
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      dueDate: t.due === null ? null : inDays(t.due),
      project: t.project ?? null,
      category: t.category ?? null,
      completedAt: t.status === 'completed' ? new Date(now.getTime() - i * 60 * 1000) : null,
      createdAt: new Date(now.getTime() - (tasks.length - i) * 60 * 60 * 1000),
    })),
  );

  console.log(`Seeded ${tasks.length} tasks, 3 projects and 3 categories (timezone ${tz}).`);
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
