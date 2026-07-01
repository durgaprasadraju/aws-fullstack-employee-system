# API Documentation

Base URL: `https://employee.company.com/api/v1`

Interactive Swagger UI: `https://employee.company.com/api/docs`

## Authentication

All endpoints except `/health` and `/auth/login` require a JWT Bearer token.

```http
Authorization: Bearer <token>
```

### POST /auth/login

Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@company.com",
      "role": "admin"
    }
  }
}
```

### GET /auth/me

Get the authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@company.com",
    "role": "admin",
    "lastLogin": "2026-07-01T10:30:00.000Z"
  }
}
```

---

## Dashboard

### GET /dashboard/stats

Aggregated statistics for the dashboard.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "employees": { "active": 7, "inactive": 0, "terminated": 0, "on_leave": 1 },
    "departments": [{ "department": "Engineering", "count": 3 }],
    "attendanceToday": [{ "status": "present", "count": 5 }],
    "leaveRequests": [{ "status": "pending", "count": 1 }],
    "payrollTrend": [{ "month": "2026-07", "total": 21124.00 }]
  }
}
```

---

## Employees

### GET /employees

List employees with pagination, search, filtering, and sorting.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 10, max: 100) |
| search | string | Search by name, email, code, position |
| sortBy | string | Column to sort by |
| sortOrder | string | `asc` or `desc` |
| status | string | Filter by status |
| department_id | integer | Filter by department |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "employee_code": "EMP004",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "department_name": "Engineering",
      "position": "Senior Software Engineer",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

### POST /employees

Create a new employee. **Roles:** admin, hr

**Request:**
```json
{
  "employee_code": "EMP009",
  "first_name": "New",
  "last_name": "Employee",
  "email": "new@company.com",
  "department_id": 1,
  "position": "Junior Developer",
  "hire_date": "2026-07-01",
  "salary": 70000
}
```

### PUT /employees/:id

Update an employee. **Roles:** admin, hr

### DELETE /employees/:id

Delete an employee. **Roles:** admin

### POST /employees/:id/profile-picture

Get a pre-signed S3 URL for uploading a profile picture.

**Request:**
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "profiles/4/1720000000.jpg"
  }
}
```

---

## Departments

### GET /departments

List all departments with manager and employee count.

### POST /departments

Create a department. **Roles:** admin, hr

```json
{
  "name": "Legal",
  "description": "Legal and compliance"
}
```

---

## Attendance

### GET /attendance

List attendance records. Filter by `employee_id`, `status`, `date`.

### POST /attendance

Record attendance. **Roles:** admin, hr, manager

```json
{
  "employee_id": 4,
  "date": "2026-07-01",
  "check_in": "09:00:00",
  "check_out": "17:30:00",
  "status": "present"
}
```

---

## Leave Management

### GET /leave

List leave requests. Filter by `employee_id`, `status`, `leave_type`.

### POST /leave

Submit a leave request.

```json
{
  "employee_id": 5,
  "leave_type": "annual",
  "start_date": "2026-08-01",
  "end_date": "2026-08-05",
  "days_requested": 5,
  "reason": "Vacation"
}
```

### PATCH /leave/:id/status

Approve or reject a leave request. **Roles:** admin, hr, manager

```json
{
  "status": "approved"
}
```

---

## Payroll

### GET /payroll

List payroll records. **Roles:** admin, hr

### POST /payroll

Create a payroll record. **Roles:** admin, hr

```json
{
  "employee_id": 4,
  "pay_period_start": "2026-07-01",
  "pay_period_end": "2026-07-31",
  "base_salary": 8750.00,
  "bonuses": 500.00,
  "deductions": 200.00,
  "tax": 2100.00
}
```

---

## Audit Logs

### GET /audit-logs

View audit trail. **Roles:** admin

---

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting

- 100 requests per 15 minutes per IP
- Returns 429 when exceeded
