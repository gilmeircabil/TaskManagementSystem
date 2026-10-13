import type { Request } from 'express';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Due dates are calendar dates (no time). They are stored as UTC midnight of that
 * date, e.g. "2026-10-13" -> 2026-10-13T00:00:00.000Z.
 *
 * "Today" depends on the user's timezone, so the client sends its IANA timezone in
 * the `X-Timezone` header. All overdue / due-today / this-week logic is computed
 * here on the server from one DateContext so the dashboard, filters and
 * notifications always agree.
 */
export interface DateContext {
  timeZone: string;
  now: Date;
  /** UTC midnight of the user's local calendar date (compare against dueDate). */
  todayStart: Date;
  tomorrowStart: Date;
  dayAfterTomorrowStart: Date;
  /** Monday of the current week, UTC midnight (compare against dueDate). */
  weekStart: Date;
  /** Monday of next week, UTC midnight (exclusive upper bound). */
  weekEnd: Date;
  /** Real instant of Monday 00:00 in the user's timezone (compare against completedAt). */
  weekStartInstant: Date;
}

export function resolveTimeZone(value: unknown): string {
  if (typeof value === 'string' && value.length > 0 && value.length <= 64) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return value;
    } catch {
      /* invalid timezone -> fall back */
    }
  }
  return 'UTC';
}

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts: Record<string, number> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return parts as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset of `timeZone` from UTC (ms) at the given instant. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function getDateContext(timeZone: string, now: Date = new Date()): DateContext {
  const p = zonedParts(now, timeZone);
  const today = Date.UTC(p.year, p.month - 1, p.day);
  const dayOfWeek = new Date(today).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStart = today - daysSinceMonday * DAY_MS;

  return {
    timeZone,
    now,
    todayStart: new Date(today),
    tomorrowStart: new Date(today + DAY_MS),
    dayAfterTomorrowStart: new Date(today + 2 * DAY_MS),
    weekStart: new Date(weekStart),
    weekEnd: new Date(weekStart + 7 * DAY_MS),
    weekStartInstant: new Date(weekStart - timeZoneOffsetMs(now, timeZone)),
  };
}

export function dateContextFor(req: Request): DateContext {
  return getDateContext(resolveTimeZone(req.get('x-timezone')));
}

/** Single source of truth for "overdue": due before today and not completed. */
export function overdueFilter(ctx: DateContext) {
  return { status: { $ne: 'completed' as const }, dueDate: { $ne: null, $lt: ctx.todayStart } };
}

export function isOverdue(task: { status: string; dueDate: Date | null | undefined }, ctx: DateContext): boolean {
  return task.status !== 'completed' && !!task.dueDate && task.dueDate.getTime() < ctx.todayStart.getTime();
}

/** "YYYY-MM-DD" -> Date at UTC midnight, or null if the string is not a real date. */
export function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function formatDateOnly(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
