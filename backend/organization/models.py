from django.db import models
from django.core.exceptions import ValidationError
from mptt.models import MPTTModel, TreeForeignKey
import uuid


class Department(MPTTModel):
    """
    Hierarchical department structure using MPTT (Modified Preorder Tree Traversal)
    For efficient tree operations
    """
    DEPARTMENT_TYPES = [
        ('executive', 'Executive'),
        ('department', 'Department'),
        ('division', 'Division'),
        ('team', 'Team'),
        ('unit', 'Unit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    department_type = models.CharField(max_length=20, choices=DEPARTMENT_TYPES, default='department')

    # Hierarchy
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                            related_name='children', db_index=True)

    # Details
    description = models.TextField(blank=True)
    cost_center_code = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)

    # Leadership
    department_head = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='headed_departments')

    # Status
    is_active = models.BooleanField(default=True)
    established_date = models.DateField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['tree_id', 'lft']

    def __str__(self):
        return f"{self.code} - {self.name}"

    def clean(self):
        # Prevent circular references
        if self.parent and self.parent == self:
            raise ValidationError("Department cannot be its own parent")

    def get_full_path(self):
        """Return full hierarchical path"""
        return " > ".join([d.name for d in self.get_ancestors(include_self=True)])


class JobTitle(models.Model):
    """Standardized job titles across organization"""
    JOB_LEVELS = [
        (1, 'Entry Level'),
        (2, 'Junior'),
        (3, 'Mid Level'),
        (4, 'Senior'),
        (5, 'Lead'),
        (6, 'Manager'),
        (7, 'Senior Manager'),
        (8, 'Director'),
        (9, 'VP'),
        (10, 'C-Level'),
        (11, 'Executive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    level = models.PositiveSmallIntegerField(choices=JOB_LEVELS, default=3)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)

    # Job description
    summary = models.TextField()
    responsibilities = models.JSONField(default=list)
    requirements = models.JSONField(default=list)
    qualifications = models.JSONField(default=list)

    # Compensation bands (annual)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_titles'
        ordering = ['level', 'title']

    def __str__(self):
        return f"{self.title} (L{self.level})"


class Location(models.Model):
    """Office/Work locations"""
    LOCATION_TYPES = [
        ('headquarters', 'Headquarters'),
        ('branch', 'Branch Office'),
        ('coworking', 'Co-working Space'),
        ('remote', 'Remote Location'),
        ('warehouse', 'Warehouse'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPES)

    # Address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    # Capacity
    total_capacity = models.PositiveIntegerField(default=0)
    parking_spaces = models.PositiveIntegerField(default=0)

    # Facilities
    amenities = models.JSONField(default=list)  # ['cafeteria', 'gym', 'meeting_rooms']

    timezone = models.CharField(max_length=50, default='America/New_York')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'locations'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.city})"


class Team(models.Model):
    """Cross-functional teams"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    # Leadership
    team_lead = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                  null=True, related_name='led_teams')

    # Members (through Employee model)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'teams'

    def __str__(self):
        return self.name