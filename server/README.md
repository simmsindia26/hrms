# Sellopedia HRD Backend

Production-ready starting backend for Sellopedia's customized HRD Management Software.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Role-based access control
- Nodemailer / Hostinger SMTP
- REST API

## Roles
- employee
- hr
- super_admin

## Modules included
- Authentication
- Dashboard
- Departments / Designations
- Job openings
- Candidates
- Interviews
- Employees
- Attendance
- Leave
- Notices / disciplinary records
- Salary structures
- Payroll
- Email templates / email logs
- Notifications
- Audit logs

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Linux/macOS:

```bash
cp .env.example .env
npm install
npm run dev
```

Server:
`http://localhost:6000`

Health:
`GET /api/v1/health`

## Create first Super Admin

Set the following in `.env`:

`SUPER_ADMIN_EMAIL=...`
`SUPER_ADMIN_PASSWORD=...`

Or use the seed script after adding the seed values to `.env`.

## Hostinger SMTP

Recommended:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hr@yourdomain.com
SMTP_PASS=your-password
```

If your Hostinger account uses STARTTLS, use port 587 and:

```env
SMTP_SECURE=false
```

Never commit `.env`.

## API base

`/api/v1`

Example login:

POST `/api/v1/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

Use:

`Authorization: Bearer <token>`

## Payroll rule

The current default payroll basis is configurable in organization settings and defaults to 26 payable days.

Example:
26000 / 26 = 1000 per day.
2 unpaid days => 24000 before other adjustments.

The payroll engine stores the calculation snapshot so historical payroll is not changed if settings are changed later.
