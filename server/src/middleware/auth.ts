import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env, isProduction } from '../config/env.js';
import { AUTH_COOKIE, AUTH_TOKEN_TTL_SECONDS } from '../constants.js';
import { HttpError } from './errors.js';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

declare module 'express-serve-static-core' {
  interface Request {
    userId?: Types.ObjectId;
  }
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

export function setAuthCookie(res: Response, userId: Types.ObjectId) {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: userId.toString(),
    expiresIn: AUTH_TOKEN_TTL_SECONDS,
    algorithm: 'HS256',
  });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: AUTH_TOKEN_TTL_SECONDS * 1000 });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  if (typeof token !== 'string' || token.length === 0) {
    next(new HttpError(401, 'Not authenticated'));
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const sub = typeof payload === 'object' ? payload.sub : undefined;
    if (typeof sub !== 'string' || !OBJECT_ID_RE.test(sub)) throw new Error('bad subject');
    req.userId = new Types.ObjectId(sub);
    next();
  } catch {
    next(new HttpError(401, 'Not authenticated'));
  }
};

/** The authenticated user's id. Every DB query must be scoped with this. */
export function authUserId(req: Request): Types.ObjectId {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  return req.userId;
}
