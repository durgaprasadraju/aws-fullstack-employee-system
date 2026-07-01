import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <div className="topbar"><h1>Profile</h1></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Account Settings</h3>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" value={user?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input className="form-control" value={user?.role || ''} disabled />
        </div>
        <div className="form-group">
          <label>Theme</label>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
    </div>
  );
}
