#!/usr/bin/env python3
"""Generate API Documentation PDF for HR ERP Platform"""
from fpdf import FPDF

class APIDocs(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, 'HR ERP Platform - API Reference', align='R')
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(30, 41, 59)
        self.cell(0, 12, title)
        self.ln(14)

    def subsection(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(51, 65, 85)
        self.cell(0, 10, title)
        self.ln(12)

    def method_badge(self, method):
        colors = {
            'GET': (34, 197, 94),
            'POST': (59, 130, 246),
            'PATCH': (234, 179, 8),
            'DELETE': (239, 68, 68),
            'PUT': (168, 85, 247),
        }
        r, g, b = colors.get(method, (100, 116, 139))
        self.set_fill_color(r, g, b)
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 8)
        w = self.get_string_width(method) + 8
        self.cell(w, 7, method, fill=True, new_x='RIGHT', new_y='TOP')

    def endpoint_row(self, method, url, description):
        y_start = self.get_y()
        if y_start > 260:
            self.add_page()

        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

        self.method_badge(method)
        self.set_font('Courier', '', 9)
        self.set_text_color(30, 41, 59)
        self.cell(0, 7, f'  {url}')
        self.ln(9)

        self.set_font('Helvetica', '', 9)
        self.set_text_color(100, 116, 139)
        self.multi_cell(0, 5, description)
        self.ln(2)

    def payload_block(self, title, payload_lines):
        if self.get_y() > 240:
            self.add_page()
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 6, title)
        self.ln(7)

        self.set_fill_color(248, 250, 252)
        self.set_draw_color(226, 232, 240)
        x = self.get_x()
        y = self.get_y()
        block_h = len(payload_lines) * 5 + 6
        self.rect(x, y, 190, block_h, style='DF')

        self.set_font('Courier', '', 8)
        self.set_text_color(51, 65, 85)
        self.ln(3)
        for line in payload_lines:
            self.cell(5)
            self.cell(0, 5, line)
            self.ln(5)
        self.ln(4)

    def info_note(self, text):
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(100, 116, 139)
        self.multi_cell(0, 5, text)
        self.ln(3)


pdf = APIDocs()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ─── COVER PAGE ───
pdf.add_page()
pdf.ln(60)
pdf.set_font('Helvetica', 'B', 28)
pdf.set_text_color(30, 41, 59)
pdf.cell(0, 15, 'HR ERP Platform', align='C')
pdf.ln(12)
pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(100, 116, 139)
pdf.cell(0, 10, 'API Reference Documentation', align='C')
pdf.ln(20)
pdf.set_font('Helvetica', '', 10)
pdf.cell(0, 8, 'Base URL: http://localhost:8000/api/v1', align='C')
pdf.ln(6)
pdf.cell(0, 8, 'Authentication: Bearer Token (JWT)', align='C')
pdf.ln(20)
pdf.set_draw_color(200, 200, 200)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(10)
pdf.set_font('Helvetica', '', 9)
pdf.set_text_color(150, 150, 150)
pdf.cell(0, 6, 'Generated for internal use. All endpoints require authentication unless noted.', align='C')


# ═══════════════════════════════════════════════════════
# 1. AUTHENTICATION
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('1. Authentication')
pdf.info_note('JWT-based authentication via SimpleJWT. Obtain a token pair, then send the access token in the Authorization header as "Bearer <token>".')

pdf.endpoint_row('POST', '/auth/token/', 'Obtain JWT access and refresh tokens.')
pdf.payload_block('Request Body', [
    '{',
    '  "email": "admin@example.com",',
    '  "password": "adminpassword123"',
    '}',
])
pdf.payload_block('Response (200)', [
    '{',
    '  "access": "eyJhbGciOi...",',
    '  "refresh": "eyJhbGciOi..."',
    '}',
])

pdf.endpoint_row('POST', '/auth/token/refresh/', 'Refresh an expired access token.')
pdf.payload_block('Request Body', [
    '{',
    '  "refresh": "eyJhbGciOi..."',
    '}',
])

pdf.endpoint_row('GET', '/auth/users/me/', 'Get the currently authenticated user profile.')
pdf.payload_block('Response (200)', [
    '{',
    '  "id": 1,',
    '  "email": "admin@example.com",',
    '  "first_name": "Admin",',
    '  "last_name": "User",',
    '  "is_hr_admin": true,',
    '  "is_manager": false,',
    '  "is_superuser": true',
    '}',
])

pdf.endpoint_row('POST', '/auth/users/change-password/', 'Change current user password.')
pdf.payload_block('Request Body', [
    '{',
    '  "old_password": "currentpassword",',
    '  "new_password": "newsecurepassword"',
    '}',
])


# ═══════════════════════════════════════════════════════
# 2. EMPLOYEES
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('2. Employees (HR Module)')

pdf.endpoint_row('GET', '/hr/employees/', 'List all employees (paginated). Supports query params for filtering.')
pdf.payload_block('Response (200)', [
    '[{',
    '  "id": "uuid",',
    '  "employee_number": "EMP001",',
    '  "first_name": "John",',
    '  "last_name": "Doe",',
    '  "full_name": "John Doe",',
    '  "work_email": "john@company.com",',
    '  "department_name": "Engineering",',
    '  "job_title_name": "Software Engineer",',
    '  "employment_status": "active",',
    '  "date_of_joining": "2024-01-15"',
    '}]',
])

pdf.endpoint_row('GET', '/hr/employees/{id}/', 'Get detailed employee profile by UUID.')

pdf.endpoint_row('POST', '/hr/employees/', 'Create a new employee record.')
pdf.payload_block('Request Body', [
    '{',
    '  "first_name": "Jane",',
    '  "last_name": "Smith",',
    '  "work_email": "jane@company.com",',
    '  "personal_email": "jane@gmail.com",',
    '  "department": "dept-uuid",',
    '  "job_title": "title-uuid",',
    '  "date_of_joining": "2025-06-01",',
    '  "date_of_birth": "1995-03-15",',
    '  "employment_status": "active"',
    '}',
])

pdf.endpoint_row('PATCH', '/hr/employees/{id}/', 'Partially update an employee.')
pdf.payload_block('Request Body (partial)', [
    '{',
    '  "department": "new-dept-uuid",',
    '  "employment_status": "on_notice"',
    '}',
])

pdf.endpoint_row('DELETE', '/hr/employees/{id}/', 'Soft-delete an employee record.')

pdf.endpoint_row('POST', '/hr/bulk-registration/', 'Bulk register multiple employees at once.')
pdf.payload_block('Request Body', [
    '[',
    '  { "first_name": "A", "last_name": "B", "work_email": "a@co.com", ... },',
    '  { "first_name": "C", "last_name": "D", "work_email": "c@co.com", ... }',
    ']',
])

pdf.endpoint_row('POST', '/hr/employees/{id}/reset-password/', 'Reset an employee user password (HR Admin).')

pdf.endpoint_row('GET', '/hr/departments/', 'List all departments.')
pdf.endpoint_row('GET', '/hr/job-titles/', 'List all job titles / designations.')


# ═══════════════════════════════════════════════════════
# 3. ATTENDANCE
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('3. Attendance')
pdf.subsection('3.1 Attendance Records')

pdf.endpoint_row('GET', '/attendance/records/', 'List attendance records for the authenticated user (admins see all).')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "employee": "emp-uuid",',
    '  "date": "2026-03-28",',
    '  "check_in": "2026-03-28T09:00:00Z",',
    '  "check_out": "2026-03-28T17:30:00Z",',
    '  "status": "present",',
    '  "total_worked": "08:30:00",',
    '  "late_by": "00:00:00",',
    '  "early_leave_by": "00:00:00",',
    '  "break_duration": "01:00:00"',
    '}',
])

pdf.endpoint_row('GET', '/attendance/records/analytics/', 'Get attendance analytics / summary statistics.')

pdf.endpoint_row('GET', '/attendance/records/by-date/?date=YYYY-MM-DD', 'Get a single attendance record for a specific date.')

pdf.endpoint_row('POST', '/attendance/records/clock_in/', 'Clock in for the current day.')
pdf.payload_block('Request Body', [
    '{',
    '  "check_in_method": "web",',
    '  "check_in_location": "Office (Verified)"',
    '}',
])

pdf.endpoint_row('POST', '/attendance/records/clock_out/', 'Clock out for the current day.')
pdf.payload_block('Request Body', [
    '{',
    '  "check_out_method": "web"',
    '}',
])

pdf.subsection('3.2 Attendance Correction Requests')

pdf.endpoint_row('GET', '/attendance/requests/', 'List all correction requests for the user.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "employee": "emp-uuid",',
    '  "employee_name": "John Doe",',
    '  "date": "2026-03-25",',
    '  "morning_punch": "09:00:00",',
    '  "break_start_punch": "13:00:00",',
    '  "break_end_punch": "14:00:00",',
    '  "leaving_punch": "18:00:00",',
    '  "reason": "Forgot to punch in",',
    '  "status": "pending",',
    '  "requested_at": "2026-03-25T19:00:00Z"',
    '}',
])

pdf.endpoint_row('POST', '/attendance/requests/', 'Submit a new attendance correction request.')
pdf.payload_block('Request Body', [
    '{',
    '  "date": "2026-03-25",',
    '  "morning_punch": "09:00",',
    '  "break_start_punch": "13:00",',
    '  "break_end_punch": "14:00",',
    '  "leaving_punch": "18:00",',
    '  "reason": "Biometric scanner was down"',
    '}',
])
pdf.info_note('All punch fields are optional. Only include the ones that need correction. Employee and status are set automatically by the server.')

pdf.endpoint_row('PATCH', '/attendance/requests/{id}/', 'Edit a pending correction request.')
pdf.payload_block('Request Body (partial)', [
    '{',
    '  "morning_punch": "09:15",',
    '  "reason": "Updated reason"',
    '}',
])
pdf.info_note('Only requests with status "pending" can be edited by the employee. Returns 403 otherwise.')

pdf.endpoint_row('DELETE', '/attendance/requests/{id}/', 'Delete a pending correction request.')
pdf.info_note('Only requests with status "pending" can be deleted by the employee. HR Admins can delete any request.')

pdf.endpoint_row('POST', '/attendance/requests/{id}/approve/', 'Approve a correction request (Manager/HR).')
pdf.endpoint_row('POST', '/attendance/requests/{id}/reject/', 'Reject a correction request (Manager/HR).')


# ═══════════════════════════════════════════════════════
# 4. LEAVE MANAGEMENT
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('4. Leave Management')
pdf.subsection('4.1 Leave Types & Balances')

pdf.endpoint_row('GET', '/leave/types/', 'List all active leave types.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "name": "Casual Leave",',
    '  "code": "CL",',
    '  "annual_quota": "20.00",',
    '  "accrual_type": "fixed",',
    '  "is_paid": true',
    '}',
])

pdf.endpoint_row('POST', '/leave/types/{id}/bulk-update-quota/', 'Bulk update annual quota for a leave type (HR Admin).')
pdf.payload_block('Request Body', [
    '{',
    '  "annual_quota": 25',
    '}',
])

pdf.endpoint_row('GET', '/leave/balances/', 'List leave balances for the authenticated user.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": 1,',
    '  "employee": "emp-uuid",',
    '  "leave_type": "type-uuid",',
    '  "leave_type_name": "Casual Leave",',
    '  "year": 2026,',
    '  "opening_balance": "20.00",',
    '  "used": "5.00",',
    '  "available": "15.00"',
    '}',
])

pdf.subsection('4.2 Leave Requests')

pdf.endpoint_row('GET', '/leave/requests/', 'List leave requests. Employees see own + team (if manager). HR sees all.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "employee": "emp-uuid",',
    '  "employee_name": "John Doe",',
    '  "leave_type": "type-uuid",',
    '  "leave_type_name": "Sick Leave",',
    '  "start_date": "2026-04-01",',
    '  "end_date": "2026-04-03",',
    '  "start_day_type": "full",',
    '  "end_day_type": "half",',
    '  "total_days": "2.50",',
    '  "reason": "Medical appointment",',
    '  "status": "pending"',
    '}',
])

pdf.endpoint_row('POST', '/leave/requests/', 'Submit a new leave request.')
pdf.payload_block('Request Body', [
    '{',
    '  "leave_type": "leave-type-uuid",',
    '  "start_date": "2026-04-01",',
    '  "end_date": "2026-04-03",',
    '  "start_day_type": "full",',
    '  "end_day_type": "half",',
    '  "reason": "Family obligation",',
    '  "is_emergency": false',
    '}',
])
pdf.info_note('Day type options: "full", "half", "three_quarter", "short". Employee and status are set by the server. Total days is auto-calculated.')

pdf.endpoint_row('PATCH', '/leave/requests/{id}/', 'Edit a pending leave request.')
pdf.payload_block('Request Body (partial)', [
    '{',
    '  "end_date": "2026-04-04",',
    '  "reason": "Extended trip"',
    '}',
])
pdf.info_note('Only requests with status "pending" can be edited. Returns 403 for non-pending requests.')

pdf.endpoint_row('DELETE', '/leave/requests/{id}/', 'Delete a pending leave request.')
pdf.info_note('Only pending requests can be deleted by the employee. HR Admins can delete any.')

pdf.endpoint_row('POST', '/leave/requests/{id}/approve/', 'Approve a leave request (Manager/HR). HR approval marks as fully "approved" and deducts balance.')
pdf.endpoint_row('POST', '/leave/requests/{id}/reject/', 'Reject a leave request.')


# ═══════════════════════════════════════════════════════
# 5. PAYROLL
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('5. Payroll')

pdf.endpoint_row('GET', '/payroll/salary-structures/', 'List all salary structure templates.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "name": "Standard Package",',
    '  "base_salary": "50000.00",',
    '  "components": { ... }',
    '}',
])

pdf.endpoint_row('GET', '/payroll/payslips/', 'List payslips for the authenticated user.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "employee": "emp-uuid",',
    '  "period": "period-uuid",',
    '  "total_earnings": "85000.00",',
    '  "total_deductions": "12000.00",',
    '  "net_salary": "73000.00",',
    '  "status": "published"',
    '}',
])

pdf.endpoint_row('GET', '/payroll/reimbursements/', 'List reimbursement claims.')
pdf.endpoint_row('POST', '/payroll/reimbursements/', 'Submit a new reimbursement claim.')
pdf.payload_block('Request Body', [
    '{',
    '  "category": "travel",',
    '  "amount": 2500.00,',
    '  "description": "Client visit taxi",',
    '  "receipt_date": "2026-03-20"',
    '}',
])


# ═══════════════════════════════════════════════════════
# 6. RECRUITMENT
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('6. Recruitment')

pdf.endpoint_row('GET', '/recruitment/job-requisitions/', 'List all job requisitions / openings.')
pdf.payload_block('Response item (200)', [
    '{',
    '  "id": "uuid",',
    '  "title": "Senior Backend Engineer",',
    '  "department": "dept-uuid",',
    '  "positions": 2,',
    '  "status": "open",',
    '  "requested_at": "2026-03-01T10:00:00Z"',
    '}',
])

pdf.endpoint_row('POST', '/recruitment/job-requisitions/', 'Create a new job requisition.')
pdf.payload_block('Request Body', [
    '{',
    '  "title": "Frontend Developer",',
    '  "department": "dept-uuid",',
    '  "positions": 1,',
    '  "description": "React/TypeScript role",',
    '  "requirements": "3+ years experience"',
    '}',
])

pdf.endpoint_row('GET', '/recruitment/candidates/', 'List all candidates in the talent pool.')
pdf.endpoint_row('GET', '/recruitment/applications/', 'List all job applications.')


# ═══════════════════════════════════════════════════════
# APPENDIX
# ═══════════════════════════════════════════════════════
pdf.add_page()
pdf.section_title('Appendix: Common Patterns')

pdf.subsection('Authentication Header')
pdf.payload_block('All authenticated requests must include:', [
    'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...',
])

pdf.subsection('Pagination')
pdf.info_note('List endpoints return paginated results by default. The response shape is:')
pdf.payload_block('Paginated Response', [
    '{',
    '  "count": 42,',
    '  "next": "http://localhost:8000/api/v1/.../&page=2",',
    '  "previous": null,',
    '  "results": [ ... ]',
    '}',
])

pdf.subsection('Error Responses')
pdf.payload_block('400 Bad Request', [
    '{',
    '  "field_name": ["This field is required."]',
    '}',
])
pdf.payload_block('401 Unauthorized', [
    '{',
    '  "detail": "Given token not valid for any token type"',
    '}',
])
pdf.payload_block('403 Forbidden', [
    '{',
    '  "detail": "Cannot delete this request because it is no longer pending."',
    '}',
])
pdf.payload_block('404 Not Found', [
    '{',
    '  "detail": "Not found."',
    '}',
])

pdf.subsection('Status Enums')
pdf.info_note(
    'Attendance Request Status: pending, manager_approved, approved, rejected, cancelled\n'
    'Leave Request Status: draft, pending, manager_approved, hr_approved, approved, rejected, cancelled, withdrawn\n'
    'Day Type: full, half, three_quarter, short'
)

# OUTPUT
import os
output_dir = '/home/usamazafar/PyCharmMiscProject/hr_erp_platform/docs'
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'api_docs.pdf')
pdf.output(output_path)
print(f'PDF generated: {output_path}')
