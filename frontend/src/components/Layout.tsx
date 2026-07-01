import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

const navItems: { path: string; label: string; icon: string; roles: UserRole[] }[] = [
  { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/employees', label: 'Employees', icon: '👥', roles: ['admin', 'hr', 'manager'] },
  { path: '/departments', label: 'Departments', icon: '🏢', roles: ['admin', 'hr', 'manager'] },
  { path: '/attendance', label: 'Attendance', icon: '📅', roles: ['admin', 'hr', 'manager'] },
  { path: '/leave', label: 'Leave', icon: '🏖️', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/payroll', label: 'Payroll', icon: '💰', roles: ['admin', 'hr'] },
  { path: '/profile', label: 'Profile', icon: '👤', roles: ['admin', 'hr', 'manager', 'employee'] },
];

export function Sidebar() {
  const { hasRole, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const visibleItems = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">EMS Portal</div>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>
          {user?.email}
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1rem' }}>
          Role: {user?.role}
        </p>
        <button className="btn btn-secondary" onClick={toggleTheme} style={{ width: '100%', marginBottom: '0.5rem' }}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <button className="btn btn-danger" onClick={logout} style={{ width: '100%' }}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
