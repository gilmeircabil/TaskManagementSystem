import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';
import { getGreeting } from '../utils/format';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuClick }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const initial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      await signOut();
      toast.success('Signed out');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Could not sign out');
    }
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Open menu">
          ☰
        </button>
        <div className="greeting-mini">
          {getGreeting()}, <strong style={{ color: 'var(--ink)' }}>{displayName}</strong>
        </div>
      </div>

      <div className="user-chip" ref={menuRef} onClick={() => setMenuOpen((o) => !o)} style={{ position: 'relative' }}>
        <div className="avatar">{initial}</div>
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              background: 'var(--card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
              minWidth: 170,
              padding: 6,
              zIndex: 30,
            }}
          >
            <div
              className="nav-link"
              style={{ color: 'var(--ink)' }}
              onClick={() => navigate('/profile')}
            >
              Profile
            </div>
            <div
              className="nav-link"
              style={{ color: 'var(--ink)' }}
              onClick={() => navigate('/settings')}
            >
              Settings
            </div>
            <div className="nav-link" style={{ color: 'var(--rust)' }} onClick={handleLogout}>
              Log out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
