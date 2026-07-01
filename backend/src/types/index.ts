/** Shared TypeScript types for the Employee Management System */

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'remote';
export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PayrollStatus = 'draft' | 'processed' | 'paid';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Employee {
  id: number;
  user_id: number | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: number | null;
  position: string | null;
  hire_date: string;
  salary: number | null;
  status: EmployeeStatus;
  profile_picture_key: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  created_at: Date;
  updated_at: Date;
  department_name?: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  created_at: Date;
  updated_at: Date;
  manager_name?: string;
  employee_count?: number;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  employee_name?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: number | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
  employee_name?: string;
  approver_name?: string;
}

export interface Payroll {
  id: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax: number;
  net_pay: number;
  status: PayrollStatus;
  payment_date: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  employee_name?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  user_email?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | number>;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
