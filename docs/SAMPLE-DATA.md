# Sample Data Reference

The seed data is loaded automatically in local development via `docker-compose`.
For AWS deployment, run `backend/database/seed.sql` against the RDS writer endpoint.

## Users & Credentials

All demo users share the password: **Password123!**

| ID | Email | Role | Employee Code |
|----|-------|------|---------------|
| 1 | admin@company.com | admin | EMP001 |
| 2 | hr@company.com | hr | EMP002 |
| 3 | manager@company.com | manager | EMP003 |
| 4 | john.doe@company.com | employee | EMP004 |
| 5 | jane.smith@company.com | employee | EMP005 |
| 6 | bob.wilson@company.com | employee | EMP006 |
| 7 | alice.brown@company.com | employee | EMP007 |
| 8 | charlie.davis@company.com | employee | EMP008 |

## Departments

| ID | Name | Manager |
|----|------|---------|
| 1 | Engineering | Michael Chen |
| 2 | Human Resources | Sarah Johnson |
| 3 | Finance | — |
| 4 | Marketing | — |
| 5 | Operations | — |

## Sample Records

- **8 attendance records** — today and yesterday across employees
- **3 leave requests** — approved, approved, and pending
- **4 payroll records** — paid, paid, processed, draft
- **3 audit log entries** — create, update, login actions

## Loading on AWS

```bash
mysql -h <rds-writer-endpoint> -u ems_admin -p employee_management < backend/database/init.sql
mysql -h <rds-writer-endpoint> -u ems_admin -p employee_management < backend/database/seed.sql
```
