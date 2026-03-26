from django.db import models
import uuid


class NotificationTemplate(models.Model):
    """Reusable notification templates"""
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App'),
        ('slack', 'Slack'),
        ('whatsapp', 'WhatsApp'),
    ]

    TRIGGER_EVENTS = [
        ('leave_submitted', 'Leave Request Submitted'),
        ('leave_approved', 'Leave Request Approved'),
        ('leave_rejected', 'Leave Request Rejected'),
        ('payslip_generated', 'Payslip Generated'),
        ('goal_assigned', 'Goal Assigned'),
        ('performance_review_start', 'Performance Review Started'),
        ('offer_sent', 'Offer Letter Sent'),
        ('employee_onboarding', 'Employee Onboarding Started'),
        ('password_reset', 'Password Reset Requested'),
        ('workflow_pending', 'Workflow Approval Pending'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    event = models.CharField(max_length=50, choices=TRIGGER_EVENTS)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)

    subject = models.CharField(max_length=255, blank=True)  # For email
    body_template = models.TextField()  # Jinja2 template syntax
    html_template = models.TextField(blank=True)

    # Recipients configuration
    to_roles = models.JSONField(default=list)  # ['employee', 'manager', 'hr']
    to_specific_users = models.JSONField(default=list)  # List of user IDs
    cc_roles = models.JSONField(default=list)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_templates'
        unique_together = ['event', 'channel']


class Notification(models.Model):
    """Sent notifications log"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL,
                                 null=True, blank=True)

    recipient = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                  related_name='notifications')
    channel = models.CharField(max_length=20, choices=NotificationTemplate.CHANNEL_CHOICES)

    # Content
    subject = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    action_url = models.URLField(blank=True)
    action_text = models.CharField(max_length=50, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Tracking
    external_id = models.CharField(max_length=255, blank=True)  # Provider message ID
    error_message = models.TextField(blank=True)

    # Context
    related_entity_type = models.CharField(max_length=50, blank=True)
    related_entity_id = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status', 'channel']),
        ]


class NotificationPreference(models.Model):
    """User notification preferences"""
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE,
                                    related_name='notification_preferences')

    # Channel preferences by event type
    preferences = models.JSONField(default=dict, help_text="""
    {
        "leave_approved": {
            "email": true,
            "push": true,
            "in_app": true,
            "sms": false
        },
        "payslip_generated": {
            "email": true,
            "push": false
        }
    }
    """)

    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    quiet_hours_timezone = models.CharField(max_length=50, default='America/New_York')

    # Digest settings
    daily_digest = models.BooleanField(default=True)
    digest_time = models.TimeField(default='09:00')

    class Meta:
        db_table = 'notification_preferences'


class ScheduledNotification(models.Model):
    """Future scheduled notifications"""
    scheduled_for = models.DateTimeField()
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    recipient = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    context_data = models.JSONField(default=dict)

    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'scheduled_notifications'
        ordering = ['scheduled_for']