import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="alert alert-error">Failed to load dashboard</div>;

  const totalEmployees = Object.values(stats.employees).reduce((a, b) => a + b, 0);
  const activeEmployees = stats.employees.active || 0;
  const pendingLeave = stats.leaveRequests.find((l) => l.status === 'pending')?.count || 0;
  const presentToday = stats.attendanceToday.find((a) => a.status === 'present')?.count || 0;

  const employeeStatusData = {
    labels: Object.keys(stats.employees).map((s) => s.replace('_', ' ')),
    datasets: [{
      data: Object.values(stats.employees),
      backgroundColor: ['#22c55e', '#94a3b8', '#ef4444', '#f59e0b'],
    }],
  };

  const departmentData = {
    labels: stats.departments.map((d) => d.department),
    datasets: [{
      label: 'Employees',
      data: stats.departments.map((d) => d.count),
      backgroundColor: '#3b82f6',
    }],
  };

  const payrollData = {
    labels: stats.payrollTrend.map((p) => p.month).reverse(),
    datasets: [{
      label: 'Net Pay ($)',
      data: stats.payrollTrend.map((p) => p.total).reverse(),
      backgroundColor: '#8b5cf6',
    }],
  };

  return (
    <div>
      <div className="topbar">
        <h1>Dashboard</h1>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <div className="value">{totalEmployees}</div>
          <div className="label">Total Employees</div>
        </div>
        <div className="card stat-card">
          <div className="value">{activeEmployees}</div>
          <div className="label">Active Employees</div>
        </div>
        <div className="card stat-card">
          <div className="value">{presentToday}</div>
          <div className="label">Present Today</div>
        </div>
        <div className="card stat-card">
          <div className="value">{pendingLeave}</div>
          <div className="label">Pending Leave</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Employee Status</h3>
          <div className="chart-container">
            <Doughnut data={employeeStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>By Department</h3>
          <div className="chart-container">
            <Bar data={departmentData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Payroll Trend</h3>
          <div className="chart-container">
            <Bar data={payrollData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
