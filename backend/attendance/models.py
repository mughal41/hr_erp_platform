from django.db import models
import uuid
from django.utils import timezone
from datetime import datetime, time, timedelta

def default_working_days():
    return [0, 1, 2, 3, 4]


class WorkSchedule(models.Model):
    """Define work schedules"""
    SCHEDULE_TYPES = [
        ('fixed', 'Fixed'),
        ('flexible', 'Flexible'),
        ('shift', 'Shift Based'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPES, default='fixed')

    # Fixed schedule
    start_time = models.TimeField(default=time(9, 0))
    end_time = models.TimeField(default=time(18, 0))
    work_duration = models.DurationField(default=timedelta(hours=8))

    # Breaks
    break_duration = models.DurationField(default=timedelta(minutes=60))
    flexible_start_window = models.DurationField(default=timedelta(minutes=30),
                                                 help_text='How early can they start')

    # Working days (0=Monday, 6=Sunday)
    working_days = models.JSONField(default=default_working_days)  # Mon-Fri default

    # Grace periods
    late_grace_period = models.DurationField(default=timedelta(minutes=15))
    early_leave_grace_period = models.DurationField(default=timedelta(minutes=15))

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'work_schedules'


class EmployeeSchedule(models.Model):
    """Link employees to schedules"""
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE,
                                    related_name='schedule')
    work_schedule = models.ForeignKey(WorkSchedule, on_delete=models.PROTECT)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    # Overrides
    custom_start_time = models.TimeField(null=True, blank=True)
    custom_end_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'employee_schedules'


class AttendanceRecord(models.Model):
    """Daily attendance records"""
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('early_leave', 'Early Leave'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('wfh', 'Work From Home'),
        ('business_trip', 'Business Trip'),
        ('holiday', 'Holiday'),
        ('weekend', 'Weekend'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='attendance_records')
    date = models.DateField(db_index=True)

    # Times
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)

    # Location tracking
    check_in_location = models.CharField(max_length=255, blank=True)
    check_in_ip = models.GenericIPAddressField(null=True, blank=True)
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_method = models.CharField(max_length=20, default='web',
                                       choices=[('web', 'Web'), ('mobile', 'Mobile App'),
                                                ('biometric', 'Biometric'), ('manual', 'Manual')])

    check_out_location = models.CharField(max_length=255, blank=True)
    check_out_ip = models.GenericIPAddressField(null=True, blank=True)
    check_out_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_method = models.CharField(max_length=20, default='web', blank=True)

    # Calculated fields
    total_worked = models.DurationField(null=True, blank=True)
    break_duration = models.DurationField(default=timedelta(0))
    overtime = models.DurationField(default=timedelta(0))
    late_by = models.DurationField(default=timedelta(0))
    early_leave_by = models.DurationField(default=timedelta(0))

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    notes = models.TextField(blank=True)

    # Approval (for manual entries)
    is_manual_entry = models.BooleanField(default=False)
    manual_entry_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_attendance')
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_records'
        unique_together = ['employee', 'date']
        ordering = ['-date', '-check_in']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def calculate_metrics(self):
        """Calculate worked hours, overtime, etc."""
        if self.check_in and self.check_out:
            total = self.check_out - self.check_in
            self.total_worked = total - self.break_duration

            schedule = self.employee.schedule.work_schedule
            expected_duration = schedule.work_duration

            if self.total_worked > expected_duration + timedelta(minutes=30):
                self.overtime = self.total_worked - expected_duration

            # Check late/early
            scheduled_start = datetime.combine(self.date, schedule.start_time)
            if self.check_in > scheduled_start + schedule.late_grace_period:
                self.late_by = self.check_in - scheduled_start
                self.status = 'late'

            scheduled_end = datetime.combine(self.date, schedule.end_time)
            if self.check_out < scheduled_end - schedule.early_leave_grace_period:
                self.early_leave_by = scheduled_end - self.check_out
                if self.status == 'late':
                    self.status = 'half_day'
                else:
                    self.status = 'early_leave'


class TimeEntry(models.Model):
    """Detailed time entries for breaks, tasks, etc."""
    ENTRY_TYPES = [
        ('work', 'Work'),
        ('break', 'Break'),
        ('lunch', 'Lunch'),
        ('meeting', 'Meeting'),
        ('training', 'Training'),
    ]

    attendance = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE,
                                   related_name='time_entries')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'time_entries'


class ShiftPattern(models.Model):
    """For shift-based work"""
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    rotation_days = models.PositiveSmallIntegerField(default=7)
    is_night_shift = models.BooleanField(default=False)
    shift_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'shift_patterns'


class ShiftAssignment(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    shift_pattern = models.ForeignKey(ShiftPattern, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'shift_assignments'


class OvertimeRequest(models.Model):
    """Overtime approval workflow"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='overtime_requests')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hours_requested = models.DecimalField(max_digits=4, decimal_places=2)
    reason = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)

    # Approval chain
    manager = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                null=True, related_name='overtime_approvals')
    manager_approved_at = models.DateTimeField(null=True, blank=True)
    manager_notes = models.TextField(blank=True)

    hr_approved_at = models.DateTimeField(null=True, blank=True)
    hr_approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='hr_overtime_approvals')

    # Compensation
    is_compensated = models.BooleanField(default=False)
    compensation_type = models.CharField(max_length=20, choices=[('pay', 'Pay'), ('leave', 'Leave')],
                                         default='pay')
    payout_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'overtime_requests'
        ordering = ['-requested_at']


class AttendanceRequest(models.Model):
    """Manual attendance correction request workflow"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('manager_approved', 'Manager Approved'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='attendance_requests')
    date = models.DateField()

    # The 4 punches requested
    morning_punch = models.TimeField()
    break_start_punch = models.TimeField()
    break_end_punch = models.TimeField()
    leaving_punch = models.TimeField()

    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)

    # Approval chain
    manager = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                null=True, blank=True, related_name='managed_attendance_requests')
    manager_action_at = models.DateTimeField(null=True, blank=True)
    manager_comments = models.TextField(blank=True)

    hr_representative = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='hr_attendance_requests')
    hr_action_at = models.DateTimeField(null=True, blank=True)
    hr_comments = models.TextField(blank=True)

    class Meta:
        db_table = 'attendance_requests'
        ordering = ['-requested_at']
        unique_together = ['employee', 'date']