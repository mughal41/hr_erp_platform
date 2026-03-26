from django.db import models
import json
import uuid


class WorkflowDefinition(models.Model):
    """Reusable workflow templates"""
    TRIGGER_TYPES = [
        ('manual', 'Manual'),
        ('on_create', 'On Record Create'),
        ('on_update', 'On Record Update'),
        ('on_delete', 'On Record Delete'),
        ('scheduled', 'Scheduled'),
        ('approval_needed', 'Approval Required'),
    ]

    ENTITY_TYPES = [
        ('leave_request', 'Leave Request'),
        ('expense_claim', 'Expense Claim'),
        ('purchase_order', 'Purchase Order'),
        ('employee_onboarding', 'Employee Onboarding'),
        ('employee_offboarding', 'Employee Offboarding'),
        ('performance_review', 'Performance Review'),
        ('salary_change', 'Salary Change'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    entity_type = models.CharField(max_length=30, choices=ENTITY_TYPES)

    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES, default='manual')
    trigger_conditions = models.JSONField(default=dict, blank=True)  # When to auto-start

    # Workflow steps stored as JSON for flexibility
    steps = models.JSONField(default=list, help_text="""
    [
        {
            "order": 1,
            "name": "Manager Approval",
            "type": "approval",
            "approver_type": "manager",  # manager, hr, specific_role, specific_person
            "approver_role": null,
            "approver_id": null,
            "is_parallel": false,
            "conditions": {"amount": {"gt": 1000}},
            "actions_on_approve": ["notify_hr", "update_status"],
            "actions_on_reject": ["notify_employee", "close"],
            "escalation_after_hours": 48
        },
        {
            "order": 2,
            "name": "HR Review",
            "type": "approval",
            "approver_type": "hr",
            ...
        },
        {
            "order": 3,
            "name": "Send Notification",
            "type": "action",
            "action_type": "send_email",
            "recipients": ["employee", "manager"],
            "template": "leave_approved"
        }
    ]
    """)

    is_active = models.BooleanField(default=True)
    version = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workflow_definitions'
        ordering = ['entity_type', 'name']


class WorkflowInstance(models.Model):
    """Running workflow instances"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_definition = models.ForeignKey(WorkflowDefinition, on_delete=models.PROTECT,
                                            related_name='instances')

    # Related record
    entity_type = models.CharField(max_length=30)
    entity_id = models.CharField(max_length=50)

    # Context data
    context_data = models.JSONField(default=dict)  # All relevant data for the workflow

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_step = models.PositiveSmallIntegerField(default=1)

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_by = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                   related_name='started_workflows')

    class Meta:
        db_table = 'workflow_instances'
        ordering = ['-started_at']


class WorkflowStepInstance(models.Model):
    """Individual step executions"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('skipped', 'Skipped'),
        ('escalated', 'Escalated'),
    ]

    workflow = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE,
                                 related_name='steps')
    step_number = models.PositiveSmallIntegerField()
    step_name = models.CharField(max_length=100)
    step_type = models.CharField(max_length=20)  # approval, action, condition, notification

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # For approval steps
    assigned_to = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='pending_workflow_steps')
    acted_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='completed_workflow_steps')
    action_taken = models.CharField(max_length=20, blank=True)  # approved, rejected
    action_notes = models.TextField(blank=True)

    started_at = models.DateTimeField(auto_now_add=True)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'workflow_step_instances'
        ordering = ['workflow', 'step_number']
        unique_together = ['workflow', 'step_number']


class WorkflowDelegation(models.Model):
    """Temporary delegation of approval authority"""
    original_approver = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                          related_name='delegated_from')
    delegated_to = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                     related_name='delegated_to')

    workflow_types = models.JSONField(default=list)  # Which workflows to delegate
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workflow_delegations'