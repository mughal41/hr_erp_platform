from django.db import models
from decimal import Decimal
import uuid


class SalaryStructure(models.Model):
    """Template for salary components"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    # Components stored as JSON for flexibility
    components = models.JSONField(default=list, help_text="""
    [
        {
            "name": "Basic Salary",
            "type": "earning",
            "calculation_type": "percentage_of_ctc",
            "value": 40,
            "is_taxable": true,
            "is_pf_applicable": true,
            "is_esi_applicable": true
        },
        {
            "name": "HRA",
            "type": "earning", 
            "calculation_type": "percentage_of_basic",
            "value": 50,
            "is_taxable": true,
            "is_pf_applicable": false
        }
    ]
    """)

    class Meta:
        db_table = 'salary_structures'


class EmployeeSalary(models.Model):
    """Employee-specific salary details"""
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE,
                                    related_name='salary_details')
    salary_structure = models.ForeignKey(SalaryStructure, on_delete=models.PROTECT)

    # Annual CTC (Cost to Company)
    annual_ctc = models.DecimalField(max_digits=12, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    # Bank details
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=20)
    branch_name = models.CharField(max_length=100)

    # Tax
    pan_number = models.CharField(max_length=20, blank=True)
    tax_regime = models.CharField(max_length=20, default='old', choices=[('old', 'Old'), ('new', 'New')])
    declared_investments = models.JSONField(default=dict, blank=True)

    # Statutory
    pf_number = models.CharField(max_length=50, blank=True)
    uan_number = models.CharField(max_length=50, blank=True)
    esi_number = models.CharField(max_length=50, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'employee_salaries'


class PayrollPeriod(models.Model):
    """Monthly payroll periods"""
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    payment_date = models.DateField()

    status = models.CharField(max_length=20, default='open',
                              choices=[('open', 'Open'), ('processing', 'Processing'),
                                       ('locked', 'Locked'), ('paid', 'Paid')])

    working_days = models.DecimalField(max_digits=4, decimal_places=1)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                     null=True, blank=True)

    class Meta:
        db_table = 'payroll_periods'
        unique_together = ['year', 'month']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.year}-{self.month:02d}"


class Payslip(models.Model):
    """Individual payslip"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('calculated', 'Calculated'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('hold', 'On Hold'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='payslips')
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE,
                                       related_name='payslips')

    # Attendance data
    days_present = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    days_absent = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    days_leave = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    days_weekoff = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    lop_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    # Earnings (stored as JSON for flexibility)
    earnings = models.JSONField(default=dict, help_text="""
    {
        "basic_salary": 25000.00,
        "hra": 12500.00,
        "conveyance": 1600.00,
        "medical": 1250.00,
        "special_allowance": 8650.00
    }
    """)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Deductions
    deductions = models.JSONField(default=dict, help_text="""
    {
        "pf_employee": 3000.00,
        "esi_employee": 0.00,
        "tds": 2500.00,
        "professional_tax": 200.00,
        "advance_deduction": 0.00
    }
    """)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Employer contributions
    employer_contributions = models.JSONField(default=dict)

    # Final calculation
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

    # YTD (Year to Date) totals
    ytd_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ytd_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ytd_tds = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payslips'
        unique_together = ['employee', 'payroll_period']
        ordering = ['-payroll_period__year', '-payroll_period__month']

    def calculate_net_salary(self):
        self.total_earnings = sum(self.earnings.values())
        self.total_deductions = sum(self.deductions.values())
        self.net_salary = self.total_earnings - self.total_deductions
        self.save()


class SalaryAdvance(models.Model):
    """Salary advance requests"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('deducting', 'Being Deducted'),
        ('completed', 'Completed'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='salary_advances')
    amount_requested = models.DecimalField(max_digits=10, decimal_places=2)
    amount_approved = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    reason = models.TextField()

    # Repayment
    repayment_months = models.PositiveSmallIntegerField(default=1)
    monthly_deduction = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_month = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_advances')
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'salary_advances'


class Reimbursement(models.Model):
    """Expense reimbursements"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    REIMBURSEMENT_TYPES = [
        ('medical', 'Medical'),
        ('travel', 'Travel'),
        ('telephone', 'Telephone'),
        ('fuel', 'Fuel'),
        ('meal', 'Meal'),
        ('training', 'Training'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='reimbursements')
    reimbursement_type = models.CharField(max_length=20, choices=REIMBURSEMENT_TYPES)

    amount_claimed = models.DecimalField(max_digits=10, decimal_places=2)
    amount_approved = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField()
    expense_date = models.DateField()

    # Receipts
    receipts = models.JSONField(default=list)  # Array of file URLs

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)

    reviewer = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='reviewed_reimbursements')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    processed_in_payslip = models.ForeignKey(Payslip, on_delete=models.SET_NULL,
                                             null=True, blank=True)

    class Meta:
        db_table = 'reimbursements'
        ordering = ['-submitted_at']