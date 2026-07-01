import { Request, Response, NextFunction } from 'express';
import { departmentRepository } from '../repositories/department.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { leaveRepository } from '../repositories/leave.repository';
import { payrollRepository } from '../repositories/payroll.repository';
import { NotFoundError } from '../utils/errors';

export class DepartmentController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search } = req.query;
      const result = await departmentRepository.findAllWithDetails({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        search: search as string,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await departmentRepository.findByIdWithDetails(parseInt(req.params.id, 10));
      if (!dept) throw new NotFoundError('Department');
      res.json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = await departmentRepository.create(req.body);
      const dept = await departmentRepository.findByIdWithDetails(id);
      res.status(201).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await departmentRepository.update(id, req.body);
      if (!updated) throw new NotFoundError('Department');
      const dept = await departmentRepository.findByIdWithDetails(id);
      res.json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await departmentRepository.delete(parseInt(req.params.id, 10));
      if (!deleted) throw new NotFoundError('Department');
      res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export class AttendanceController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, employee_id, status, date } = req.query;
      const result = await attendanceRepository.findAllWithEmployee({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        filters: {
          ...(employee_id && { employee_id: parseInt(employee_id as string, 10) }),
          ...(status && { status: status as string }),
          ...(date && { date: date as string }),
        },
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = await attendanceRepository.create(req.body);
      const record = await attendanceRepository.findById(id);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await attendanceRepository.update(id, req.body);
      if (!updated) throw new NotFoundError('Attendance record');
      const record = await attendanceRepository.findById(id);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };
}

export class LeaveController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, employee_id, status, leave_type } = req.query;
      const result = await leaveRepository.findAllWithDetails({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        filters: {
          ...(employee_id && { employee_id: parseInt(employee_id as string, 10) }),
          ...(status && { status: status as string }),
          ...(leave_type && { leave_type: leave_type as string }),
        },
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = await leaveRepository.create(req.body);
      const record = await leaveRepository.findById(id);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, rejection_reason } = req.body;
      const updated = await leaveRepository.updateStatus(
        id,
        status,
        req.user!.userId,
        rejection_reason
      );
      if (!updated) throw new NotFoundError('Leave request');
      const record = await leaveRepository.findById(id);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };
}

export class PayrollController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, employee_id, status } = req.query;
      const result = await payrollRepository.findAllWithEmployee({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        filters: {
          ...(employee_id && { employee_id: parseInt(employee_id as string, 10) }),
          ...(status && { status: status as string }),
        },
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = await payrollRepository.create(req.body);
      const record = await payrollRepository.findById(id);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await payrollRepository.update(id, req.body);
      if (!updated) throw new NotFoundError('Payroll record');
      const record = await payrollRepository.findById(id);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };
}

export class DashboardController {
  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [employeeStatus, departmentCounts, attendanceToday, leaveStatus, payrollTotals] =
        await Promise.all([
          employeeRepository.countByStatus(),
          employeeRepository.countByDepartment(),
          attendanceRepository.getTodaySummary(),
          leaveRepository.countByStatus(),
          payrollRepository.getMonthlyTotals(),
        ]);

      res.json({
        success: true,
        data: {
          employees: employeeStatus,
          departments: departmentCounts,
          attendanceToday,
          leaveRequests: leaveStatus,
          payrollTrend: payrollTotals,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const departmentController = new DepartmentController();
export const attendanceController = new AttendanceController();
export const leaveController = new LeaveController();
export const payrollController = new PayrollController();
export const dashboardController = new DashboardController();
