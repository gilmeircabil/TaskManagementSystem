import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../format';
import type { Priority, TaskStatus } from '../types';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

/** Color-coded badge that is also a dropdown, for inline priority changes. */
export function PrioritySelect({
  value,
  onChange,
  label,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
  label: string;
}) {
  return (
    <select
      className={`badge-select badge-${value}`}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value as Priority)}
    >
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}

/** Color-coded badge that is also a dropdown, for inline status changes. */
export function StatusSelect({
  value,
  onChange,
  label,
}: {
  value: TaskStatus;
  onChange: (s: TaskStatus) => void;
  label: string;
}) {
  return (
    <select
      className={`badge-select badge-${value}`}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
