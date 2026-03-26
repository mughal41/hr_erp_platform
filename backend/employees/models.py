import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone


class Employee(models.Model):
    """
    Core employee record - SINGLE TENANT (no company FK needed)
    Links to Django User for authentication
    """
    EMPLOYMENT_TYPES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
        ('freelance', 'Freelancer'),
        ('consultant', 'Consultant'),
    ]

    EMPLOYMENT_STATUSES = [
        ('active', 'Active'),
        ('probation', 'On Probation'),
        ('notice_period', 'Notice Period'),
        ('suspended', 'Suspended'),
        ('terminated', 'Terminated'),
        ('resigned', 'Resigned'),
        ('retired', 'Retired'),
        ('on_leave', 'On Leave'),
    ]

    GENDERS = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('non_binary', 'Non-Binary'),
        ('prefer_not_say', 'Prefer Not to Say'),
    ]

    BLOOD_TYPES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    MARITAL_STATUSES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
        ('domestic_partnership', 'Domestic Partnership'),
    ]

    # Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link to User (One-to-One)
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE,
                                related_name='employee_profile')

    # Employee ID (display ID, separate from UUID)
    employee_number = models.CharField(max_length=20, unique=True, db_index=True)

    # Personal Information
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=GENDERS)
    blood_group = models.CharField(max_length=5, choices=BLOOD_TYPES, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUSES)
    nationality = models.CharField(max_length=2)  # ISO country code

    # Contact
    personal_email = models.EmailField(blank=True)
    work_email = models.EmailField(unique=True)
    work_phone = models.CharField(max_length=20, blank=True)
    personal_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)

    # Address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2)

    # Employment Details
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='full_time')
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUSES, default='active')

    # Organization
    department = models.ForeignKey('organization.Department', on_delete=models.PROTECT,
                                   related_name='employees')
    job_title = models.ForeignKey('organization.JobTitle', on_delete=models.PROTECT,
                                  related_name='employees')
    team = models.ForeignKey('organization.Team', on_delete=models.SET_NULL,
                             null=True, blank=True, related_name='members')
    location = models.ForeignKey('organization.Location', on_delete=models.SET_NULL,
                                 null=True, related_name='employees')

    # Reporting Structure
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='direct_reports')
    skip_level_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='skip_level_reports')

    # Dates
    date_of_joining = models.DateField()
    probation_end_date = models.DateField(null=True, blank=True)
    confirmation_date = models.DateField(null=True, blank=True)
    last_working_date = models.DateField(null=True, blank=True)

    # Work
    work_location_type = models.CharField(max_length=20, default='office',
                                          choices=[('office', 'Office'), ('remote', 'Remote'),
                                                   ('hybrid', 'Hybrid')])
    shift_timing = models.CharField(max_length=50, default='9:00-18:00')
    weekly_work_days = models.PositiveSmallIntegerField(default=5)

    # Compensation (reference to Payroll for actual amounts)
    current_salary_grade = models.CharField(max_length=20, blank=True)
    pay_frequency = models.CharField(max_length=20, default='monthly',
                                     choices=[('hourly', 'Hourly'), ('weekly', 'Weekly'),
                                              ('biweekly', 'Bi-weekly'), ('monthly', 'Monthly')])

    # Documents
    id_proof_type = models.CharField(max_length=50, blank=True)  # Passport, Driver's License, etc.
    id_proof_number = models.CharField(max_length=50, blank=True)
    passport_number = models.CharField(max_length=50, blank=True)
    passport_expiry = models.DateField(null=True, blank=True)

    # System
    is_manager = models.BooleanField(default=False)
    can_approve_expenses = models.BooleanField(default=False)
    can_approve_leave = models.BooleanField(default=False)
    can_approve_timesheets = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True,
                                   related_name='created_employees')

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='deleted_employees')

    class Meta:
        db_table = 'employees'
        ordering = ['-date_of_joining']
        permissions = [
            ('can_view_all_employees', 'Can view all employee records'),
            ('can_export_employees', 'Can export employee data'),
            ('can_manage_terminations', 'Can process terminations'),
        ]

    def __str__(self):
        return f"{self.employee_number} - {self.full_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".strip()

    @property
    def age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - (
                    (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def tenure_years(self):
        if self.date_of_joining:
            today = timezone.now().date()
            return (today - self.date_of_joining).days / 365.25
        return 0

    def get_reporting_chain(self):
        """Get full reporting chain up to CEO"""
        chain = []
        current = self.manager
        while current:
            chain.append(current)
            current = current.manager
        return chain

    def save(self, *args, **kwargs):
        # Auto-update user flags
        if self.user:
            self.user.is_manager = self.is_manager
            self.user.save(update_fields=['is_manager'])
        super().save(*args, **kwargs)


class EmployeeHistory(models.Model):
    """Track all changes to employee records"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='history')
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True)
    field_name = models.CharField(max_length=50)
    old_value = models.TextField()
    new_value = models.TextField()
    reason = models.TextField(blank=True)

    class Meta:
        db_table = 'employee_history'
        ordering = ['-changed_at']


class EmployeeDocument(models.Model):
    """Employee-specific documents"""
    DOCUMENT_TYPES = [
        ('contract', 'Employment Contract'),
        ('offer_letter', 'Offer Letter'),
        ('resume', 'Resume/CV'),
        ('id_proof', 'ID Proof'),
        ('education', 'Education Certificate'),
        ('experience', 'Experience Letter'),
        ('payslip', 'Payslip'),
        ('tax_form', 'Tax Form'),
        ('medical', 'Medical Record'),
        ('background_check', 'Background Check'),
        ('visa', 'Visa/Work Permit'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='employee_documents/%Y/%m/')
    file_size = models.PositiveIntegerField(help_text='Size in bytes')
    mime_type = models.CharField(max_length=100)

    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)

    # Expiry (for documents like visas)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    reminder_days = models.PositiveSmallIntegerField(default=30,
                                                     help_text='Days before expiry to send reminder')

    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True,
                                    related_name='uploaded_documents')

    class Meta:
        db_table = 'employee_documents'
        ordering = ['-uploaded_at']

    def clean(self):
        if self.expiry_date and self.issue_date and self.expiry_date < self.issue_date:
            raise ValidationError("Expiry date cannot be before issue date")


class CompensationHistory(models.Model):
    """Track salary changes"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='compensation_history')
    effective_date = models.DateField()
    previous_salary = models.DecimalField(max_digits=12, decimal_places=2)
    new_salary = models.DecimalField(max_digits=12, decimal_places=2)
    change_reason = models.TextField()
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True,
                                    related_name='approved_compensation_changes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'compensation_history'
        ordering = ['-effective_date']