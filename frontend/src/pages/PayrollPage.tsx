import { useEffect, useState } from 'react';
import { payrollApi } from '../services/api';
import { Payroll } from '../types';

export function PayrollPage() {
  const [records, setRecords] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payrollApi.list({ limit: 20 })
      .then(({ data }) => setRecords(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar"><h1>Payroll</h1></div>
      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Base Salary</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employee_name}</td>
                    <td>{r.pay_period_start} — {r.pay_period_end}</td>
                    <td>${r.base_salary.toLocaleString()}</td>
                    <td>${r.net_pay.toLocaleString()}</td>
                    <td><span className={`badge badge-${r.status === 'paid' ? 'success' : r.status === 'processed' ? 'info' : 'warning'}`}>{r.status}</span></td>
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
