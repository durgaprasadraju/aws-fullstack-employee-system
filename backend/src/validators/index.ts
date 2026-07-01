import { body, param, query } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const employeeCreateValidation = [
  body('employee_code').trim().notEmpty().withMessage('Employee code required'),
  body('first_name').trim().notEmpty().withMessage('First name required'),
  body('last_name').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('hire_date').isISO8601().withMessage('Valid hire date required'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be positive'),
  body('status').optional().isIn(['active', 'inactive', 'terminated', 'on_leave']),
  body('department_id').optional().isInt({ min: 1 }),
];

export const employeeUpdateValidation = [
  param('id').isInt({ min: 1 }),
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('salary').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'terminated', 'on_leave']),
];

export const departmentValidation = [
  body('name').trim().notEmpty().withMessage('Department name required'),
  body('description').optional().trim(),
  body('manager_id').optional().isInt({ min: 1 }),
];

export const attendanceValidation = [
  body('employee_id').isInt({ min: 1 }).withMessage('Employee ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('status').optional().isIn(['present', 'absent', 'late', 'half_day', 'remote']),
  body('check_in').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('check_out').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/),
];

export const leaveValidation = [
  body('employee_id').isInt({ min: 1 }),
  body('leave_type').isIn(['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid']),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('days_requested').isFloat({ min: 0.5 }),
  body('reason').optional().trim(),
];

export const leaveStatusValidation = [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['approved', 'rejected', 'cancelled']),
  body('rejection_reason').optional().trim(),
];

export const payrollValidation = [
  body('employee_id').isInt({ min: 1 }),
  body('pay_period_start').isISO8601(),
  body('pay_period_end').isISO8601(),
  body('base_salary').isFloat({ min: 0 }),
  body('bonuses').optional().isFloat({ min: 0 }),
  body('deductions').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 }),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

export const idParamValidation = [param('id').isInt({ min: 1 })];

export const profilePictureValidation = [
  param('id').isInt({ min: 1 }),
  body('filename').trim().notEmpty(),
  body('contentType').isIn(['image/jpeg', 'image/png', 'image/webp']),
];
