import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TaskUiProvider } from '../context/TaskUiContext';
import { useToast } from '../context/ToastContext';
import { initials } from '../format';
import { useDismiss } from '../hooks/useDismiss';
import {
  IconCheck,
  IconDashboard,
  IconFolder,
  IconLogout,
  IconMenu,
  IconTag,
  IconTasks,
  IconX,
} from './Icons';
import { ConfirmDialog } from './Modal';
import { NotificationBell } from './NotificationBell';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/categories': 'Categories',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/cookies': 'Cookie Policy',
  '/accessibility': 'Accessibility Statement',
};

function UserMenu({ onLogout, onDeleteAccount }: { onLogout: () => void; onDeleteAccount: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss([ref], close, open);
  if (!user) return null;

  return (
    <div className="dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="user-btn"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{initials(user.name)}</span>
        <span className="user-name">{user.name}</span>
      </button>
      {open && (
        <div className="dropdown user-dropdown" role="menu">
          <div className="dropdown-header">
            <strong>{user.name}</strong>
            <span className="muted small">{user.email}</span>
          </div>
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <IconLogout size={16} /> Log out
          </button>
          <button
            type="button"
            className="menu-item menu-item-danger"
            onClick={() => {
              close();
              onDeleteAccount();
            }}
          >
            Delete Account…
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { logout, deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setNavOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast('Account and all associated data permanently deleted');
      navigate('/login', { replace: true });
    } catch {
      toast('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDeleteAccount(false);
    }
  };

  const title = TITLES[location.pathname] ?? 'TaskFlow';
  const links = [
    { to: '/', label: 'Dashboard', icon: <IconDashboard />, end: true },
    { to: '/tasks', label: 'Tasks', icon: <IconTasks /> },
    { to: '/projects', label: 'Projects', icon: <IconFolder /> },
    { to: '/categories', label: 'Categories', icon: <IconTag /> },
  ];

  return (
    <TaskUiProvider>
      {/* M-03: Skip to main content accessibility link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="app-shell">
        <aside className={`sidebar ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
          <div className="sidebar-top">
            <div className="logo">
              <span className="logo-mark">
                <IconCheck size={16} strokeWidth={3} />
              </span>
              TaskFlow
            </div>
            <button
              type="button"
              className="icon-btn sidebar-close"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
            >
              <IconX />
            </button>
          </div>

          <nav className="nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {l.icon}
                {l.label}
              </NavLink>
            ))}
          </nav>

          <button type="button" className="nav-link logout-link" onClick={handleLogout}>
            <IconLogout />
            Logout
          </button>

          {/* L-02: Sidebar legal & version footer */}
          <div className="sidebar-footer">
            <div className="sidebar-policy-links">
              <Link to="/privacy">Privacy</Link>
              <span>·</span>
              <Link to="/terms">Terms</Link>
              <span>·</span>
              <Link to="/cookies">Cookies</Link>
              <span>·</span>
              <Link to="/accessibility">A11y</Link>
            </div>
            <p className="copyright-text">© {new Date().getFullYear()} TaskFlow</p>
          </div>
        </aside>
        {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}

        <div className="main">
          <header className="topbar">
            <button
              type="button"
              className="icon-btn hamburger"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu size={22} />
            </button>
            <h1 className="page-title">{title}</h1>
            <div className="topbar-actions">
              <NotificationBell />
              <UserMenu onLogout={handleLogout} onDeleteAccount={() => setConfirmDeleteAccount(true)} />
            </div>
          </header>

          {/* M-03: Keyboard target for skip link */}
          <main className="content" id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>

      {confirmDeleteAccount && (
        <ConfirmDialog
          title="Delete Account?"
          message={
            <>
              Are you sure you want to permanently delete your account?
              <br />
              <strong style={{ color: 'var(--danger)' }}>
                This action is immediate and cannot be undone. All your tasks, projects, and categories will be permanently erased.
              </strong>
            </>
          }
          confirmLabel="Delete Everything"
          busy={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDeleteAccount(false)}
        />
      )}
    </TaskUiProvider>
  );
}
