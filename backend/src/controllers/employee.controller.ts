import { Request, Response, NextFunction } from 'express';
import { employeeRepository } from '../repositories/employee.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  buildProfilePictureKey,
  deleteObject,
} from '../services/s3.service';

export class EmployeeController {
  /** GET /employees */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder, search, status, department_id } = req.query;
      const result = await employeeRepository.findAllWithDepartment({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string,
        filters: {
          ...(status && { status: status as string }),
          ...(department_id && { department_id: parseInt(department_id as string, 10) }),
        },
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  /** GET /employees/:id */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await employeeRepository.findByIdWithDepartment(
        parseInt(req.params.id, 10)
      );
      if (!employee) throw new NotFoundError('Employee');

      let profilePictureUrl: string | null = null;
      if (employee.profile_picture_key) {
        profilePictureUrl = await getDownloadPresignedUrl(employee.profile_picture_key);
      }

      res.json({
        success: true,
        data: { ...employee, profile_picture_url: profilePictureUrl },
      });
    } catch (error) {
      next(error);
    }
  };

  /** POST /employees */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = await employeeRepository.create(req.body);
      const employee = await employeeRepository.findByIdWithDepartment(id);
      res.status(201).json({ success: true, data: employee });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        next(new ConflictError('Employee with this email or code already exists'));
        return;
      }
      next(error);
    }
  };

  /** PUT /employees/:id */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await employeeRepository.update(id, req.body);
      if (!updated) throw new NotFoundError('Employee');

      const employee = await employeeRepository.findByIdWithDepartment(id);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /employees/:id */
  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const employee = await employeeRepository.findById(id);
      if (!employee) throw new NotFoundError('Employee');

      if (employee.profile_picture_key) {
        await deleteObject(employee.profile_picture_key);
      }

      await employeeRepository.delete(id);
      res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
      next(error);
    }
  };

  /** POST /employees/:id/profile-picture */
  getUploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { filename, contentType } = req.body;

      const key = buildProfilePictureKey(id, filename);
      const uploadUrl = await getUploadPresignedUrl(key, contentType);

      await employeeRepository.update(id, { profile_picture_key: key });

      res.json({
        success: true,
        data: { uploadUrl, key },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const employeeController = new EmployeeController();
