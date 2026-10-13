import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import {
  globalLimiter,
  requestTimeout,
  securityHeaders,
  verifyOrigin,
} from './middleware/security.js';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { dashboardRouter } from './routes/dashboard.js';
import { notificationsRouter } from './routes/notifications.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // Express 5's default "simple" query parser never builds nested objects from the query string.
  app.set('query parser', 'simple');

  // C-02: Helmet HTTP Security Headers (CSP, HSTS, frame-ancestors, noSniff)
  app.use(securityHeaders);

  // M-01: Global 15-second request timeout
  app.use(requestTimeout);

  // H-05: CSRF / Origin header verification for mutating requests
  app.use(verifyOrigin);

  // C-01: Global rate limiter on all API endpoints
  app.use('/api', globalLimiter);

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Auth endpoints (brute-force rate limiting applied individually on sensitive routes)
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationsRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
