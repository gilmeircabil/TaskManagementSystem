import { Types } from 'mongoose';
import { z } from 'zod';
import { parseDateOnly } from './dates.js';

/** A 24-char hex string, converted to an ObjectId. Rejects objects like {"$ne": ...}. */
export const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const objectId = objectIdString.transform((s) => new Types.ObjectId(s));

/** "YYYY-MM-DD" -> Date at UTC midnight. */
export const dateOnly = z
  .string()
  .transform((s, ctx) => {
    const d = parseDateOnly(s);
    if (!d) {
      ctx.addIssue({ code: 'custom', message: 'Expected a date in YYYY-MM-DD format' });
      return z.NEVER;
    }
    return d;
  });

export const idParams = z.strictObject({ id: objectId });

/** Escape user input before using it inside a RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
