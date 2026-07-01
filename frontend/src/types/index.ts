export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  lastLogin?: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: number;
  department_name?: string;
  position?: string;
  hire_date: string;
  salary?: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  profile_picture_url?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_name?: string;
  employee_count?: number;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  reason?: string;
}

export interface Payroll {
  id: number;
  employee_id: number;
  employee_name?: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  net_pay: number;
  status: string;
}

export interface DashboardStats {
  employees: Record<string, number>;
  departments: { department: string; count: number }[];
  attendanceToday: { status: string; count: number }[];
  leaveRequests: { status: string; count: number }[];
  payrollTrend: { month: string; total: number }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
