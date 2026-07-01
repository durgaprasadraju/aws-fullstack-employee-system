import axios from 'axios';
import type { Employee } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Employees
export const employeeApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/employees', { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: Partial<Employee>) => api.post('/employees', data),
  update: (id: number, data: Partial<Employee>) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

// Departments
export const departmentApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/departments', { params }),
  create: (data: { name: string; description?: string }) =>
    api.post('/departments', data),
};

// Attendance
export const attendanceApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/attendance', { params }),
};

// Leave
export const leaveApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/leave', { params }),
  updateStatus: (id: number, status: string, rejection_reason?: string) =>
    api.patch(`/leave/${id}/status`, { status, rejection_reason }),
};

// Payroll
export const payrollApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/payroll', { params }),
};
