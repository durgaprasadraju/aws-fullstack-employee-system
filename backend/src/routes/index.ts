import { Router, Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { employeeController } from '../controllers/employee.controller';
import {
  departmentController,
  attendanceController,
  leaveController,
  payrollController,
  dashboardController,
} from '../controllers/resource.controller';
import { auditController } from '../controllers/audit.controller';
import { authenticate, authorize, auditContext } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { validate } from '../utils/helpers';
import {
  loginValidation,
  employeeCreateValidation,
  employeeUpdateValidation,
  departmentValidation,
  attendanceValidation,
  leaveValidation,
  leaveStatusValidation,
  payrollValidation,
  paginationValidation,
  idParamValidation,
  profilePictureValidation,
} from '../validators';

const router: Router = Router();

// Health check — used by ALB target group
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth routes (public)
router.post('/auth/login', validate(loginValidation), auditContext, authController.login);
router.get('/auth/me', authenticate, authController.getProfile);

// Dashboard
router.get('/dashboard/stats', authenticate, dashboardController.getStats);

// Employee routes
router.get('/employees', authenticate, validate(paginationValidation), employeeController.list);
router.get('/employees/:id', authenticate, validate(idParamValidation), employeeController.getById);
router.post(
  '/employees',
  authenticate,
  authorize('admin', 'hr'),
  validate(employeeCreateValidation),
  auditContext,
  auditLog('CREATE', 'employee'),
  employeeController.create
);
router.put(
  '/employees/:id',
  authenticate,
  authorize('admin', 'hr'),
  validate(employeeUpdateValidation),
  auditContext,
  auditLog('UPDATE', 'employee'),
  employeeController.update
);
router.delete(
  '/employees/:id',
  authenticate,
  authorize('admin'),
  validate(idParamValidation),
  auditContext,
  auditLog('DELETE', 'employee'),
  employeeController.remove
);
router.post(
  '/employees/:id/profile-picture',
  authenticate,
  validate(profilePictureValidation),
  employeeController.getUploadUrl
);

// Department routes
router.get('/departments', authenticate, validate(paginationValidation), departmentController.list);
router.get('/departments/:id', authenticate, validate(idParamValidation), departmentController.getById);
router.post(
  '/departments',
  authenticate,
  authorize('admin', 'hr'),
  validate(departmentValidation),
  auditContext,
  auditLog('CREATE', 'department'),
  departmentController.create
);
router.put(
  '/departments/:id',
  authenticate,
  authorize('admin', 'hr'),
  validate([...idParamValidation, ...departmentValidation]),
  auditContext,
  auditLog('UPDATE', 'department'),
  departmentController.update
);
router.delete(
  '/departments/:id',
  authenticate,
  authorize('admin'),
  validate(idParamValidation),
  departmentController.remove
);

// Attendance routes
router.get('/attendance', authenticate, validate(paginationValidation), attendanceController.list);
router.post(
  '/attendance',
  authenticate,
  authorize('admin', 'hr', 'manager'),
  validate(attendanceValidation),
  auditContext,
  auditLog('CREATE', 'attendance'),
  attendanceController.create
);
router.put(
  '/attendance/:id',
  authenticate,
  authorize('admin', 'hr', 'manager'),
  validate([...idParamValidation]),
  auditContext,
  auditLog('UPDATE', 'attendance'),
  attendanceController.update
);

// Leave routes
router.get('/leave', authenticate, validate(paginationValidation), leaveController.list);
router.post(
  '/leave',
  authenticate,
  validate(leaveValidation),
  auditContext,
  auditLog('CREATE', 'leave_request'),
  leaveController.create
);
router.patch(
  '/leave/:id/status',
  authenticate,
  authorize('admin', 'hr', 'manager'),
  validate(leaveStatusValidation),
  auditContext,
  auditLog('UPDATE', 'leave_request'),
  leaveController.updateStatus
);

// Payroll routes
router.get('/payroll', authenticate, authorize('admin', 'hr'), validate(paginationValidation), payrollController.list);
router.post(
  '/payroll',
  authenticate,
  authorize('admin', 'hr'),
  validate(payrollValidation),
  auditContext,
  auditLog('CREATE', 'payroll'),
  payrollController.create
);
router.put(
  '/payroll/:id',
  authenticate,
  authorize('admin', 'hr'),
  validate([...idParamValidation]),
  auditContext,
  auditLog('UPDATE', 'payroll'),
  payrollController.update
);

// Audit log (admin only)
router.get('/audit-logs', authenticate, authorize('admin'), auditController.list);

export default router;
