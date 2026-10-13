import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useTaskUi } from '../context/TaskUiContext';
import { formatDate } from '../format';
import { useDismiss } from '../hooks/useDismiss';
import type { NotificationItem, NotificationsResponse } from '../types';
import { IconBell } from './Icons';

const REFRESH_MS = 60_000;

function describe(n: NotificationItem) {
  if (n.type === 'overdue') return `Overdue · was due ${formatDate(n.dueDate)}`;
  if (n.type === 'due_today') return 'Due today';
  return 'Due tomorrow';
}

export function NotificationBell() {
  const { version, openEdit } = useTaskUi();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss([wrapRef], close, open);

  const load = useCallback(() => {
    api<NotificationsResponse>('/notifications')
      .then(setData)
      .catch(() => {
        /* keep last known list; next poll will retry */
      });
  }, []);

  // Refresh on load, every 60s, and whenever tasks change.
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load, version]);

  const count = data?.count ?? 0;

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn bell-btn"
        aria-label={`Notifications${count ? ` (${count})` : ''}`}
        aria-expanded={open}
        onClick={() => {
          if (!open) load();
          setOpen((o) => !o);
        }}
      >
        <IconBell size={20} />
        {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="dropdown notif-dropdown" role="menu">
          <div className="dropdown-header">
            <strong>Reminders</strong>
            <span className="muted small">Overdue or due within 48h</span>
          </div>
          {!data || data.items.length === 0 ? (
            <div className="muted center pad small">You’re all caught up 🎉</div>
          ) : (
            <ul className="notif-list">
              {data.items.map((n) => (
                <li key={n.taskId}>
                  <button
                    type="button"
                    className="notif-item"
                    onClick={() => {
                      setOpen(false);
                      openEdit(n.taskId);
                    }}
                  >
                    <span className={`notif-dot notif-${n.type}`} aria-hidden />
                    <span className="notif-text">
                      <span className="notif-title">{n.title}</span>
                      <span className={`notif-meta ${n.type === 'overdue' ? 'text-danger' : ''}`}>{describe(n)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && data.count > data.items.length && (
            <div className="muted small center pad-sm">Showing {data.items.length} of {data.count}</div>
          )}
        </div>
      )}
    </div>
  );
}
