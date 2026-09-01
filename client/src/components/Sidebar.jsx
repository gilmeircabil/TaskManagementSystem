import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◧' },
  { to: '/expenses', label: 'Expenses', icon: '−' },
  { to: '/income', label: 'Income', icon: '+' },
  { to: '/transactions', label: 'Transactions', icon: '≡' },
  { to: '/reports', label: 'Reports', icon: '▤' },
];

const ACCOUNT_ITEMS = [
  { to: '/profile', label: 'Profile', icon: '◐' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="coin">₱</span>
          <span>Kupon</span>
        </div>

        <div className="nav-group">
          <div className="nav-label">Overview</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-label">Account</div>
          {ACCOUNT_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">Kupon Ledger · v1.0</div>
      </aside>
      <div className={`sidebar-scrim ${open ? 'open' : ''}`} onClick={onClose} />
    </>
  );
}
