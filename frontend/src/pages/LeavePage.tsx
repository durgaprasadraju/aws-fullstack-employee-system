import { useEffect, useState } from 'react';
import { leaveApi } from '../services/api';
import { LeaveRequest } from '../types';
import { useAuth } from '../context/AuthContext';

export function LeavePage() {
  const { hasRole } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeave = () => {
    leaveApi.list({ limit: 20 })
      .then(({ data }) => setRequests(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeave(); }, []);

  const handleStatus = async (id: number, status: string) => {
    await leaveApi.updateStatus(id, status);
    fetchLeave();
  };

  return (
    <div>
      <div className="topbar"><h1>Leave Management</h1></div>
      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  {hasRole('admin', 'hr', 'manager') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employee_name}</td>
                    <td>{r.leave_type}</td>
                    <td>{r.start_date}</td>
                    <td>{r.end_date}</td>
                    <td>{r.days_requested}</td>
                    <td><span className={`badge badge-${r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}`}>{r.status}</span></td>
                    {hasRole('admin', 'hr', 'manager') && r.status === 'pending' && (
                      <td>
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.25rem' }} onClick={() => handleStatus(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleStatus(r.id, 'rejected')}>Reject</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
