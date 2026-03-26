from django.core.exceptions import ValidationError
from django.db import models


class CompanySettings(models.Model):
    """
    SINGLE-TENANT: Only ONE record exists per deployment
    Stores all company-wide configuration
    """
    COMPANY_TYPES = [
        ('startup', 'Startup'),
        ('sme', 'Small/Medium Enterprise'),
        ('enterprise', 'Enterprise'),
        ('nonprofit', 'Non-Profit'),
        ('government', 'Government'),
    ]

    id = models.AutoField(primary_key=True)  # Only one record, ID=1

    # Basic Info
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True)
    company_type = models.CharField(max_length=20, choices=COMPANY_TYPES, default='sme')
    registration_number = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to='company/logo/', blank=True)
    favicon = models.ImageField(upload_to='company/favicon/', blank=True)

    # Contact
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, default='US')  # ISO code
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    website = models.URLField(blank=True)

    # Branding
    primary_color = models.CharField(max_length=7, default='#1890ff')
    secondary_color = models.CharField(max_length=7, default='#52c41a')
    font_family = models.CharField(max_length=50, default='Inter')
    custom_css = models.TextField(blank=True)

    # Localization
    default_language = models.CharField(max_length=10, default='en')
    default_timezone = models.CharField(max_length=50, default='America/New_York')
    date_format = models.CharField(max_length=20, default='MM/DD/YYYY')
    time_format = models.CharField(max_length=10, default='12h')
    currency = models.CharField(max_length=3, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')

    # Business Rules
    fiscal_year_start = models.DateField(null=True, blank=True)
    work_week_start = models.PositiveSmallIntegerField(default=1)  # 1=Monday
    standard_work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.00)

    # Features Toggles (Enable/disable modules)
    features = models.JSONField(default=dict, help_text="""
    {
        "recruitment": true,
        "payroll": true,
        "performance": true,
        "training": true,
        "expenses": true,
        "assets": true,
        "helpdesk": false
    }
    """)

    # Security Settings
    password_policy = models.JSONField(default=dict, help_text="""
    {
        "min_length": 8,
        "require_uppercase": true,
        "require_lowercase": true,
        "require_numbers": true,
        "require_special": true,
        "expiry_days": 90,
        "prevent_reuse": 5
    }
    """)

    mfa_required = models.BooleanField(default=False)
    mfa_methods = models.JSONField(default=list)  # ['app', 'sms', 'email']

    session_timeout = models.PositiveIntegerField(default=30, help_text='Minutes')
    allowed_ip_ranges = models.JSONField(default=list, blank=True)

    # Email Settings
    email_from_name = models.CharField(max_length=100, default='HR Portal')
    email_from_address = models.EmailField()
    smtp_settings = models.JSONField(default=dict, blank=True)

    # Integrations
    slack_webhook = models.URLField(blank=True)
    google_workspace_domain = models.CharField(max_length=255, blank=True)
    ms_tenant_id = models.CharField(max_length=255, blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    setup_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'company_settings'
        verbose_name = 'Company Settings'
        verbose_name_plural = 'Company Settings'

    def save(self, *args, **kwargs):
        # Ensure only one record exists
        if not self.pk and CompanySettings.objects.exists():
            raise ValidationError("Only one CompanySettings record allowed")
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get or create singleton settings"""
        settings, _ = cls.objects.get_or_create(pk=1, defaults={'name': 'My Company'})
        return settings


class CompanyBranding(models.Model):
    """Extended branding options"""
    company = models.OneToOneField(CompanySettings, on_delete=models.CASCADE, primary_key=True)
    login_background = models.ImageField(upload_to='company/branding/', blank=True)
    email_header_image = models.ImageField(upload_to='company/branding/', blank=True)
    email_footer_text = models.TextField(blank=True)
    custom_email_templates = models.JSONField(default=dict)

    class Meta:
        db_table = 'company_branding'


class AuditLog(models.Model):
    """System-wide audit logging"""
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
    ]

    id = models.BigAutoField(primary_key=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=50, db_index=True)  # Model name
    entity_id = models.CharField(max_length=50, db_index=True)
    description = models.TextField()
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user', '-timestamp']),
        ]