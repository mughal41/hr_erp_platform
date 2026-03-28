from django.db import models
from django.core.exceptions import ValidationError
from datetime import timedelta
import uuid

class LeaveType(models.Model):
    """Configurable leave types"""
    ACCRUAL_TYPES = [
        ('fixed', 'Fixed Annual'),
        ('accrual', 'Monthly Accrual'),
        ('unlimited', 'Unlimited'),
        ('manual', 'Manual Grant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    color_code = models.CharField(max_length=7, default='#1890ff')

    # Accrual settings
    accrual_type = models.CharField(max_length=20, choices=ACCRUAL_TYPES, default='fixed')
    annual_quota = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    accrual_rate = models.DecimalField(max_digits=5, decimal_places=2, default=1.67,
                                       help_text='Per month if accrual type')
    max_carry_forward = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    max_encashment = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Rules
    min_days_per_request = models.DecimalField(max_digits=3, decimal_places=1, default=0.5)
    max_days_per_request = models.DecimalField(max_digits=3, decimal_places=1, default=30.0)
    notice_required_days = models.PositiveSmallIntegerField(default=7)
    requires_documentation = models.BooleanField(default=False)
    documentation_threshold = models.DecimalField(max_digits=3, decimal_places=1, default=3.0,
                                                  help_text='Days after which docs required')

    # Eligibility
    applicable_to = models.JSONField(default=list)  # ['full_time', 'part_time']
    exclude_probation = models.BooleanField(default=True)
    gender_specific = models.CharField(max_length=20, blank=True)  # 'female' for maternity

    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'leave_types'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class LeaveBalance(models.Model):
    """Employee leave balances"""
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE,
                                   related_name='balances')
    year = models.PositiveSmallIntegerField()

    # Balances
    opening_balance = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    accrued = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    used = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    encashed = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    lapsed = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    carried_forward = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    @property
    def available(self):
        return (self.opening_balance + self.accrued + self.carried_forward -
                self.used - self.encashed - self.lapsed)

    @property
    def closing_balance(self):
        return self.available


class Meta:
    db_table = 'leave_balances'
    unique_together = ['employee', 'leave_type', 'year']
    ordering = ['-year', 'leave_type__display_order']


class LeaveRequest(models.Model):
    """Leave application workflow"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('manager_approved', 'Manager Approved'),
        ('hr_approved', 'HR Approved'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('withdrawn', 'Withdrawn'),
    ]

    DAY_CHOICES = [
        ('full', 'Full Day'),
        ('half', 'Half Day'),
        ('three_quarter', 'Three Quarter Day (75%)'),
        ('short', 'Short Leave (25%)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)

    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    start_day_type = models.CharField(max_length=20, choices=DAY_CHOICES, default='full')
    end_day_type = models.CharField(max_length=20, choices=DAY_CHOICES, default='full')

    # Calculated
    total_days = models.DecimalField(max_digits=5, decimal_places=2)

    # Details
    reason = models.TextField()
    contact_during_leave = models.CharField(max_length=100, blank=True)
    is_emergency = models.BooleanField(default=False)
    selected_quarters = models.JSONField(default=list, blank=True, help_text='Selected 2-hour slots for partial leave (Q1, Q2, Q3, Q4)')

    # Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    current_approver = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='pending_approvals')

    # Approval chain
    manager = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                null=True, related_name='leave_manager_approvals')
    manager_action_at = models.DateTimeField(null=True, blank=True)
    manager_comments = models.TextField(blank=True)

    hr_representative = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='leave_hr_approvals')
    hr_action_at = models.DateTimeField(null=True, blank=True)
    hr_comments = models.TextField(blank=True)

    # Documents
    attachment = models.FileField(upload_to='leave_documents/%Y/%m/', blank=True)

    # System
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'leave_requests'
        ordering = ['-requested_at']
        permissions = [
            ('can_approve_all_leaves', 'Can approve any leave request'),
            ('can_view_team_leaves', 'Can view team leave calendar'),
        ]

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date")

        # Force calculation of total days if not set
        if not self.total_days:
            self.calculate_total_days()

        # Check balance - only if trying to submit/approve
        if self.status not in ['draft', 'cancelled', 'withdrawn', 'rejected']:
            try:
                balance = LeaveBalance.objects.get(
                    employee=self.employee,
                    leave_type=self.leave_type,
                    year=self.start_date.year
                )
                if balance.available < self.total_days:
                    raise ValidationError(f"Insufficient leave balance. Available: {balance.available}, Requested: {self.total_days}")
            except LeaveBalance.DoesNotExist:
                raise ValidationError("No leave balance record found for this employee, year and leave type.")

    def calculate_total_days(self):
        """Calculate actual working days excluding weekends and holidays"""
        if not self.start_date or not self.end_date:
            return 0
            
        weights = {
            'full': 1.0,
            'half': 0.5,
            'three_quarter': 0.75,
            'short': 0.25,
        }
        
        days = 0
        curr = self.start_date
        while curr <= self.end_date:
            weight = 1.0
            if curr == self.start_date:
                weight = weights.get(self.start_day_type, 1.0)
            elif curr == self.end_date:
                weight = weights.get(self.end_day_type, 1.0)
            
            days = float(days) + float(weight)
            curr += timedelta(days=1)
        
        from decimal import Decimal
        self.total_days = Decimal(str(days))
        return self.total_days

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_instance = LeaveRequest.objects.get(pk=self.pk)
                old_status = old_instance.status
            except LeaveRequest.DoesNotExist:
                pass
        
        if not self.total_days:
            self.calculate_total_days()
            
        super().save(*args, **kwargs)
        
        # Handle LeaveBalance deduction when approved
        if self.status == 'approved' and old_status != 'approved':
            balance, _ = LeaveBalance.objects.get_or_create(
                employee=self.employee,
                leave_type=self.leave_type,
                year=self.start_date.year,
                defaults={'opening_balance': self.leave_type.annual_quota}
            )
            balance.used = float(balance.used) + float(self.total_days)
            balance.save()
        # Handle deduction reversal if no longer approved
        elif old_status == 'approved' and self.status != 'approved':
            try:
                balance = LeaveBalance.objects.get(
                    employee=self.employee,
                    leave_type=self.leave_type,
                    year=self.start_date.year
                )
                balance.used = max(0, float(balance.used) - float(self.total_days))
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass


class LeaveCalendar(models.Model):
    """Company holidays and events"""
    EVENT_TYPES = [
        ('public_holiday', 'Public Holiday'),
        ('company_event', 'Company Event'),
        ('restricted', 'Restricted Holiday'),
        ('optional', 'Optional Holiday'),
    ]

    date = models.DateField()
    name = models.CharField(max_length=100)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField(blank=True)
    locations = models.ManyToManyField('organization.Location', blank=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True)  # 'yearly'

    class Meta:
        db_table = 'leave_calendar'
        ordering = ['date']


class CompOffRequest(models.Model):
    """Compensatory off requests"""
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='compoff_requests')
    overtime_date = models.DateField()
    compoff_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, default='pending')
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_compoffs')

    class Meta:
        db_table = 'compoff_requests'