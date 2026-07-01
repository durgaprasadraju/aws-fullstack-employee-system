-- Sample seed data for development and testing
USE employee_management;

-- Password for all users: Password123!
-- bcrypt hash generated with cost factor 12
SET @password_hash = '$2b$12$fwxuwpSeaXMC8IldCq2DpezZVJ3tclNvAe0E4na7By7AaKlQtac12';

INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and infrastructure'),
('Human Resources', 'People operations and talent management'),
('Finance', 'Financial planning and accounting'),
('Marketing', 'Brand and growth marketing'),
('Operations', 'Business operations and logistics');

INSERT INTO users (email, password_hash, role) VALUES
('admin@company.com', @password_hash, 'admin'),
('hr@company.com', @password_hash, 'hr'),
('manager@company.com', @password_hash, 'manager'),
('john.doe@company.com', @password_hash, 'employee'),
('jane.smith@company.com', @password_hash, 'employee'),
('bob.wilson@company.com', @password_hash, 'employee'),
('alice.brown@company.com', @password_hash, 'employee'),
('charlie.davis@company.com', @password_hash, 'employee');

INSERT INTO employees (user_id, employee_code, first_name, last_name, email, phone, department_id, position, hire_date, salary, status) VALUES
(1, 'EMP001', 'System', 'Admin', 'admin@company.com', '+1-555-0100', 2, 'System Administrator', '2020-01-15', 95000.00, 'active'),
(2, 'EMP002', 'Sarah', 'Johnson', 'hr@company.com', '+1-555-0101', 2, 'HR Director', '2019-03-20', 88000.00, 'active'),
(3, 'EMP003', 'Michael', 'Chen', 'manager@company.com', '+1-555-0102', 1, 'Engineering Manager', '2018-06-01', 120000.00, 'active'),
(4, 'EMP004', 'John', 'Doe', 'john.doe@company.com', '+1-555-0103', 1, 'Senior Software Engineer', '2021-02-10', 105000.00, 'active'),
(5, 'EMP005', 'Jane', 'Smith', 'jane.smith@company.com', '+1-555-0104', 1, 'Software Engineer', '2022-05-15', 85000.00, 'active'),
(6, 'EMP006', 'Bob', 'Wilson', 'bob.wilson@company.com', '+1-555-0105', 3, 'Financial Analyst', '2021-08-01', 75000.00, 'active'),
(7, 'EMP007', 'Alice', 'Brown', 'alice.brown@company.com', '+1-555-0106', 4, 'Marketing Specialist', '2023-01-10', 65000.00, 'active'),
(8, 'EMP008', 'Charlie', 'Davis', 'charlie.davis@company.com', '+1-555-0107', 5, 'Operations Coordinator', '2022-11-20', 60000.00, 'active');

UPDATE departments SET manager_id = 3 WHERE id = 1;
UPDATE departments SET manager_id = 2 WHERE id = 2;

INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
(4, CURDATE(), '09:00:00', '17:30:00', 'present'),
(5, CURDATE(), '09:15:00', '17:45:00', 'late'),
(6, CURDATE(), '08:45:00', '17:00:00', 'present'),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:30:00', 'present'),
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '17:30:00', 'present'),
(6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, NULL, 'absent'),
(7, CURDATE(), '09:30:00', '18:00:00', 'remote'),
(8, CURDATE(), '08:30:00', '16:30:00', 'present');

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status, approved_by, approved_at) VALUES
(5, 'annual', DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 5, 'Family vacation', 'approved', 2, NOW()),
(7, 'sick', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 2, 'Flu', 'approved', 2, NOW()),
(8, 'personal', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1, 'Personal appointment', 'pending', NULL, NULL);

INSERT INTO payroll (employee_id, pay_period_start, pay_period_end, base_salary, bonuses, deductions, tax, net_pay, status, payment_date) VALUES
(4, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 8750.00, 500.00, 200.00, 2100.00, 6950.00, 'paid', LAST_DAY(CURDATE())),
(5, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 7083.33, 0, 150.00, 1700.00, 5233.33, 'paid', LAST_DAY(CURDATE())),
(6, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 6250.00, 250.00, 100.00, 1500.00, 4900.00, 'processed', NULL),
(7, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 5416.67, 0, 75.00, 1300.00, 4041.67, 'draft', NULL);

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES
(1, 'CREATE', 'employee', 4, '{"first_name": "John", "last_name": "Doe"}', '10.0.1.50'),
(2, 'UPDATE', 'leave_request', 1, '{"status": "approved"}', '10.0.1.51'),
(1, 'LOGIN', 'user', 1, NULL, '10.0.1.50');
