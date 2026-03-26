from django.db import models
import uuid

class Course(models.Model):
    """Training courses"""
    COURSE_TYPES = [
        ('mandatory', 'Mandatory'),
        ('technical', 'Technical Skills'),
        ('soft_skills', 'Soft Skills'),
        ('compliance', 'Compliance'),
        ('leadership', 'Leadership'),
        ('onboarding', 'Onboarding'),
        ('safety', 'Safety'),
    ]

    DELIVERY_MODES = [
        ('online', 'Online Self-Paced'),
        ('virtual', 'Virtual Instructor-Led'),
        ('classroom', 'Classroom'),
        ('blended', 'Blended'),
        ('workshop', 'Workshop'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    course_type = models.CharField(max_length=20, choices=COURSE_TYPES)
    delivery_mode = models.CharField(max_length=20, choices=DELIVERY_MODES)

    # Content
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    syllabus = models.TextField()
    learning_objectives = models.JSONField(default=list)
    prerequisites = models.JSONField(default=list)

    # Resources
    thumbnail = models.ImageField(upload_to='courses/thumbnails/', blank=True)
    content_url = models.URLField(blank=True)
    materials = models.JSONField(default=list)  # List of file URLs

    # Configuration
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=70.00)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    validity_months = models.PositiveSmallIntegerField(default=12,
                                                       help_text='How long certification is valid')
    is_active = models.BooleanField(default=True)

    # Instructor (if applicable)
    instructor = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='courses_taught')
    external_instructor = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['title']


class CourseSession(models.Model):
    """Scheduled instances of courses"""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('enrolling', 'Open for Enrollment'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')

    # Schedule
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default='America/New_York')

    # Location/Platform
    location = models.ForeignKey('organization.Location', on_delete=models.SET_NULL,
                                 null=True, blank=True)
    virtual_link = models.URLField(blank=True)

    # Capacity
    max_participants = models.PositiveIntegerField(default=20)
    waitlist_enabled = models.BooleanField(default=True)
    waitlist_limit = models.PositiveIntegerField(default=5)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    # Organizer
    organizer = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                  related_name='organized_sessions')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_sessions'
        ordering = ['-start_date']


class Enrollment(models.Model):
    """Employee course enrollments"""
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('no_show', 'No Show'),
        ('waitlisted', 'Waitlisted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(CourseSession, on_delete=models.CASCADE, related_name='enrollments')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='course_enrollments')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Progress
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    time_spent_minutes = models.PositiveIntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    # Assessment
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    attempts_used = models.PositiveSmallIntegerField(default=0)

    # Feedback
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)

    # Certificate
    certificate_issued = models.BooleanField(default=False)
    certificate_url = models.URLField(blank=True)
    valid_until = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['session', 'employee']


class Skill(models.Model):
    """Skill taxonomy"""
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('soft_skills', 'Soft Skills'),
        ('leadership', 'Leadership'),
        ('domain', 'Domain Knowledge'),
        ('tools', 'Tools & Software'),
        ('languages', 'Languages'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'skills'
        ordering = ['category', 'name']


class EmployeeSkill(models.Model):
    """Employee skill matrix"""
    PROFICIENCY_LEVELS = [
        (1, 'Beginner'),
        (2, 'Intermediate'),
        (3, 'Advanced'),
        (4, 'Expert'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE,
                                 related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)

    proficiency = models.PositiveSmallIntegerField(choices=PROFICIENCY_LEVELS)
    is_primary_skill = models.BooleanField(default=False)
    years_experience = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    # Validation
    validated_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                     null=True, blank=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    # Self assessment
    self_assessed_level = models.PositiveSmallIntegerField(choices=PROFICIENCY_LEVELS)
    interested_in_developing = models.BooleanField(default=False)

    class Meta:
        db_table = 'employee_skills'
        unique_together = ['employee', 'skill']


class LearningPath(models.Model):
    """Curated learning journeys"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    target_role = models.ForeignKey('organization.JobTitle', on_delete=models.SET_NULL,
                                    null=True, blank=True)

    courses = models.ManyToManyField(Course, through='LearningPathCourse')
    estimated_duration_hours = models.DecimalField(max_digits=6, decimal_places=2)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'learning_paths'


class LearningPathCourse(models.Model):
    """Ordering courses in learning path"""
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    sequence_order = models.PositiveSmallIntegerField()
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        db_table = 'learning_path_courses'
        ordering = ['sequence_order']
        unique_together = ['learning_path', 'course']