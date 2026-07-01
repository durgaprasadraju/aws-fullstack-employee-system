import { useEffect, useState } from 'react';
import { employeeApi } from '../services/api';
import { Employee } from '../types';
import { useAuth } from '../context/AuthContext';

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-warning',
    terminated: 'badge-danger',
    on_leave: 'badge-info',
  };
  return <span className={`badge ${classes[status] || 'badge-info'}`}>{status}</span>;
}

export function EmployeesPage() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmployees = () => {
    setLoading(true);
    employeeApi.list({ page, limit: 10, search })
      .then(({ data }) => {
        setEmployees(data.data);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, [page, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this employee?')) return;
    await employeeApi.delete(id);
    fetchEmployees();
  };

  return (
    <div>
      <div className="topbar">
        <h1>Employees</h1>
        <div className="topbar-actions">
          <input
            className="form-control"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 250 }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  {hasRole('admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_code}</td>
                    <td>{emp.first_name} {emp.last_name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department_name || '—'}</td>
                    <td>{emp.position || '—'}</td>
                    <td><StatusBadge status={emp.status} /></td>
                    {hasRole('admin') && (
                      <td>
                        <button className="btn btn-danger" onClick={() => handleDelete(emp.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
