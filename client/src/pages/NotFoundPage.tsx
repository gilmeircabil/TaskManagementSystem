import { Link } from 'react-router-dom';
import { IconCheck } from '../components/Icons';

/**
 * M-02: Dedicated 404 Page
 * Provides clear navigation back to the dashboard or login rather than a silent redirect.
 */
export function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <div className="logo auth-logo">
          <span className="logo-mark">
            <IconCheck size={16} strokeWidth={3} />
          </span>
          TaskFlow
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>404</h1>
        <h2>Page Not Found</h2>
        <p className="muted" style={{ fontSize: '0.9375rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary btn-block" style={{ marginTop: '0.75rem' }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
