import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { PriorityBadge } from '../components/Badges';
import { IconPlus } from '../components/Icons';
import { useTaskUi } from '../context/TaskUiContext';
import { formatDate } from '../format';
import type { DashboardStats } from '../types';

export function DashboardPage() {
  const { version, openCreate, openEdit } = useTaskUi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refetch whenever any task is created, edited or deleted.
  useEffect(() => {
    let cancelled = false;
    api<DashboardStats>('/dashboard/stats')
      .then((s) => {
        if (!cancelled) {
          setStats(s);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const cards = stats
    ? [
        { label: 'Total Tasks', value: stats.total, tone: 'blue', to: '/tasks' },
        { label: 'To Do', value: stats.todo, tone: 'slate', to: '/tasks?status=todo' },
        { label: 'In Progress', value: stats.inProgress, tone: 'indigo', to: '/tasks?status=in_progress' },
        { label: 'Completed', value: stats.completed, tone: 'green', to: '/tasks?status=completed' },
        { label: 'Overdue', value: stats.overdue, tone: 'red', to: '/tasks?due=overdue' },
      ]
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Overview</h2>
          <p className="muted">Your progress at a glance.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} /> Add Task
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!stats && !error && <div className="muted pad">Loading…</div>}

      {stats && (
        <>
          <div className="stat-grid">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className={`card stat-card tone-${c.tone}`} data-testid={`stat-${c.label}`}>
                <span className="stat-label">{c.label}</span>
                <span className="stat-value">{c.value}</span>
              </Link>
            ))}
          </div>

          <div className="dash-grid">
            <section className="card">
              <h3 className="card-title">Progress</h3>
              <div className="progress-head">
                <span className="progress-pct" data-testid="completion-rate">
                  {stats.completionRate}%
                </span>
                <span className="muted">
                  {stats.completed} of {stats.total} tasks completed
                </span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={stats.completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Completion"
              >
                <div className="progress-bar" style={{ width: `${stats.completionRate}%` }} />
              </div>
              <div className="week-stat">
                <span className="week-value" data-testid="completed-this-week">
                  {stats.completedThisWeek}
                </span>
                <span className="muted">tasks completed this week</span>
              </div>
            </section>

            <section className="card">
              <div className="card-title-row">
                <h3 className="card-title">Upcoming</h3>
                <Link to="/tasks?sort=due_asc" className="small">
                  View all
                </Link>
              </div>
              {stats.upcoming.length === 0 ? (
                <p className="muted small">No upcoming deadlines.</p>
              ) : (
                <ul className="upcoming-list">
                  {stats.upcoming.map((t) => (
                    <li key={t.id}>
                      <button type="button" className="upcoming-item" onClick={() => openEdit(t.id)}>
                        <span className="upcoming-title">{t.title}</span>
                        <span className="upcoming-meta">
                          <PriorityBadge priority={t.priority} />
                          <span className="muted small">{formatDate(t.dueDate)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
