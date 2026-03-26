from django.db import models
import uuid


class PerformanceCycle(models.Model):
    """Review periods"""
    CYCLE_TYPES = [
        ('annual', 'Annual'),
        ('half_yearly', 'Half-Yearly'),
        ('quarterly', 'Quarterly'),
        ('monthly', 'Monthly'),
        ('project', 'Project Based'),
    ]

    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('goal_setting', 'Goal Setting'),
        ('self_review', 'Self Review'),
        ('manager_review', 'Manager Review'),
        ('calibration', 'Calibration'),
        ('hr_review', 'HR Review'),
        ('completed', 'Completed'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # "FY 2025-26"
    cycle_type = models.CharField(max_length=20, choices=CYCLE_TYPES, default='annual')

    # Dates
    start_date = models.DateField()
    end_date = models.DateField()

    # Phase dates
    goal_setting_start = models.DateField()
    goal_setting_end = models.DateField()
    self_review_start = models.DateField()
    self_review_end = models.DateField()
    manager_review_start = models.DateField()
    manager_review_end = models.DateField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')

    # Configuration
    rating_scale = models.JSONField(default=dict, help_text="""
    {
        "min": 1,
        "max": 5,
        "labels": {
            "1": "Below Expectations",
            "3": "Meets Expectations", 
            "5": "Exceeds Expectations"
        }
    }
    """)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'performance_cycles'
        ordering = ['-start_date']


class PerformanceReview(models.Model):
    """Individual performance review"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('goal_setting', 'Goal Setting'),
        ('self_review_pending', 'Self Review Pending'),
        ('self_review_submitted', 'Self Review Submitted'),
        ('manager_review', 'Manager Review'),
        ('reviewed', 'Reviewed'),
        ('calibration', 'In Calibration'),
        ('finalized', 'Finalized'),
        ('acknowledged', 'Acknowledged'),
        ('disputed', 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(PerformanceCycle, on_delete=models.CASCADE, related_name='reviews')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='performance_reviews')
    manager = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                related_name='team_reviews')

    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='not_started')

    # Goal Setting
    goals = models.JSONField(default=list)  # List of OKRs/KPIs

    # Self Assessment
    self_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    self_assessment = models.TextField(blank=True)
    self_review_submitted_at = models.DateTimeField(null=True, blank=True)

    # Manager Assessment
    manager_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    manager_assessment = models.TextField(blank=True)
    manager_reviewed_at = models.DateTimeField(null=True, blank=True)

    # Calibration
    calibrated_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    calibration_comments = models.TextField(blank=True)

    # Final
    final_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    normalized_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Recommendation
    promotion_recommended = models.BooleanField(default=False)
    salary_hike_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bonus_recommended = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Acknowledgment
    employee_acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    employee_comments = models.TextField(blank=True)

    # Dispute
    disputed = models.BooleanField(default=False)
    dispute_reason = models.TextField(blank=True)
    dispute_resolved_at = models.DateTimeField(null=True, blank=True)
    dispute_resolution = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_reviews'
        unique_together = ['cycle', 'employee']
        ordering = ['-cycle__start_date']


class Goal(models.Model):
    """Individual OKRs/KPIs"""
    GOAL_TYPES = [
        ('objective', 'Objective'),
        ('key_result', 'Key Result'),
        ('kpi', 'KPI'),
        ('development', 'Development Goal'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('active', 'Active'),
        ('on_track', 'On Track'),
        ('at_risk', 'At Risk'),
        ('delayed', 'Delayed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(PerformanceReview, on_delete=models.CASCADE, related_name='performance_goals')

    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES, default='objective')
    parent_goal = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='sub_goals')

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, blank=True)  # Technical, Leadership, etc.

    # Measurement
    target_value = models.FloatField(null=True, blank=True)
    current_value = models.FloatField(default=0)
    unit = models.CharField(max_length=50, blank=True)  # %, count, $, etc.
    start_value = models.FloatField(default=0)

    # Progress
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Weightage
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                    help_text='Percentage weight in overall rating')

    # Timeline
    start_date = models.DateField()
    due_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)

    # Approval
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'goals'
        ordering = ['-created_at']


class FeedbackRequest(models.Model):
    """360-degree feedback"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('reminded', 'Reminded'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(PerformanceReview, on_delete=models.CASCADE, related_name='feedback_requests')

    # Who is giving feedback
    provider = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='feedback_given')
    provider_relationship = models.CharField(max_length=20,
                                             choices=[('peer', 'Peer'), ('manager', 'Manager'),
                                                      ('subordinate', 'Subordinate'), ('self', 'Self'),
                                                      ('cross_functional', 'Cross Functional')])

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Feedback content
    feedback_content = models.JSONField(default=dict, blank=True)
    comments = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)

    class Meta:
        db_table = 'feedback_requests'
        unique_together = ['review', 'provider']


class ContinuousFeedback(models.Model):
    """Real-time feedback between employees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    recipient = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                  related_name='received_feedback')
    provider = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='sent_feedback')

    feedback_type = models.CharField(max_length=20,
                                     choices=[('praise', 'Praise'), ('improvement', 'Area for Improvement'),
                                              ('general', 'General Feedback')])
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # If true, only visible to recipient and managers

    # Context
    related_goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'continuous_feedback'
        ordering = ['-created_at']