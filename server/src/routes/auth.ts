import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { authUserId, clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { authLimiter } from '../middleware/security.js';
import { Category } from '../models/Category.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User, serializeUser } from '../models/User.js';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS = 'Invalid email or password';
// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-not-a-real-password', BCRYPT_ROUNDS);

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

const registerBody = z.strictObject({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginBody = z.strictObject({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(128),
});

// Helper for security audit logging (M-06)
function logSecurityEvent(event: string, meta: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY ${timestamp}] ${event}`, JSON.stringify(meta));
}

authRouter.post('/register', authLimiter, async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const body = registerBody.parse(req.body);
  const existing = await User.exists({ email: body.email });
  if (existing) {
    logSecurityEvent('AUTH_REGISTER_FAIL_DUPLICATE', { email: body.email, ip: clientIp });
    throw new HttpError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  const user = await User.create({ name: body.name, email: body.email, passwordHash });

  logSecurityEvent('AUTH_REGISTER_SUCCESS', { userId: user._id.toString(), email: user.email, ip: clientIp });
  setAuthCookie(res, user._id);
  res.status(201).json({ user: serializeUser(user) });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    logSecurityEvent('AUTH_LOGIN_FAIL_BAD_INPUT', { ip: clientIp });
    throw new HttpError(401, INVALID_CREDENTIALS);
  }
  const { email: loginEmail, password } = parsed.data;

  const user = await User.findOne({ email: loginEmail }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    logSecurityEvent('AUTH_LOGIN_FAIL_INVALID_CREDENTIALS', { email: loginEmail, ip: clientIp });
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  logSecurityEvent('AUTH_LOGIN_SUCCESS', { userId: user._id.toString(), email: user.email, ip: clientIp });
  setAuthCookie(res, user._id);
  res.json({ user: serializeUser(user) });
});

authRouter.post('/logout', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  logSecurityEvent('AUTH_LOGOUT', { ip: clientIp });
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(authUserId(req));
  if (!user) {
    clearAuthCookie(res);
    throw new HttpError(401, 'Not authenticated');
  }
  res.json({ user: serializeUser(user) });
});

/**
 * H-04: Account Deletion (GDPR Right to Erasure)
 * Permanently deletes the authenticated user and all associated tasks, projects, and categories.
 */
authRouter.delete('/me', requireAuth, async (req, res) => {
  const userId = authUserId(req);
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Cascading removal of all user data
  const [tasksDeleted, projectsDeleted, categoriesDeleted] = await Promise.all([
    Task.deleteMany({ user: userId }),
    Project.deleteMany({ user: userId }),
    Category.deleteMany({ user: userId }),
  ]);

  await User.deleteOne({ _id: userId });

  logSecurityEvent('AUTH_ACCOUNT_DELETED', {
    userId: userId.toString(),
    tasksDeleted: tasksDeleted.deletedCount,
    projectsDeleted: projectsDeleted.deletedCount,
    categoriesDeleted: categoriesDeleted.deletedCount,
    ip: clientIp,
  });

  clearAuthCookie(res);
  res.status(204).end();
});
