import { useEffect, useState } from 'react';
import { departmentApi } from '../services/api';
import { Department } from '../types';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    departmentApi.list({ limit: 50 })
      .then(({ data }) => setDepartments(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar"><h1>Departments</h1></div>
      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Manager</th>
                  <th>Employees</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td><strong>{dept.name}</strong></td>
                    <td>{dept.manager_name || '—'}</td>
                    <td>{dept.employee_count ?? 0}</td>
                    <td>{dept.description || '—'}</td>
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
