from django.db import models
import uuid

class JobRequisition(models.Model):
    """Job opening requests"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('open', 'Open'),
        ('on_hold', 'On Hold'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    EMPLOYMENT_TYPES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requisition_code = models.CharField(max_length=20, unique=True, db_index=True)

    # Position details
    title = models.CharField(max_length=200)
    department = models.ForeignKey('organization.Department', on_delete=models.PROTECT)
    job_title = models.ForeignKey('organization.JobTitle', on_delete=models.PROTECT)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    location = models.ForeignKey('organization.Location', on_delete=models.SET_NULL, null=True)

    # Requirements
    number_of_positions = models.PositiveSmallIntegerField(default=1)
    min_experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    max_experience_years = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Description
    job_description = models.TextField()
    responsibilities = models.JSONField(default=list)
    requirements = models.JSONField(default=list)
    skills_required = models.JSONField(default=list)

    # Hiring team
    hiring_manager = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                       related_name='managed_requisitions')
    recruiter = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name='recruiting_requisitions')

    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    requested_by = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                     related_name='requested_requisitions')
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_requisitions')
    approved_at = models.DateTimeField(null=True, blank=True)

    # Publishing
    is_posted_externally = models.BooleanField(default=False)
    external_job_portals = models.JSONField(default=list)  # ['linkedin', 'indeed']
    posted_at = models.DateTimeField(null=True, blank=True)
    application_deadline = models.DateField(null=True, blank=True)

    # Metrics
    target_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'job_requisitions'
        ordering = ['-requested_at']


class Candidate(models.Model):
    """Candidate profiles"""
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_say', 'Prefer Not to Say'),
    ]

    SOURCE_CHOICES = [
        ('linkedin', 'LinkedIn'),
        ('indeed', 'Indeed'),
        ('company_website', 'Company Website'),
        ('referral', 'Employee Referral'),
        ('agency', 'Recruitment Agency'),
        ('job_fair', 'Job Fair'),
        ('social_media', 'Social Media'),
        ('direct', 'Direct Application'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Personal
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)

    # Profile
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    current_location = models.CharField(max_length=100, blank=True)
    preferred_location = models.CharField(max_length=100, blank=True)
    current_ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notice_period_days = models.PositiveSmallIntegerField(null=True, blank=True)

    # Experience & Education
    total_experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    current_employer = models.CharField(max_length=100, blank=True)
    current_designation = models.CharField(max_length=100, blank=True)
    highest_qualification = models.CharField(max_length=100, blank=True)

    # Skills
    skills = models.JSONField(default=list)
    resume = models.FileField(upload_to='candidates/resumes/%Y/%m/')
    resume_parsed_data = models.JSONField(default=dict, blank=True)

    # Source
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='direct')
    referred_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='referred_candidates')
    source_details = models.CharField(max_length=255, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    blacklisted = models.BooleanField(default=False)
    blacklist_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = 'candidates'
        ordering = ['-created_at']


    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Application(models.Model):
    """Job applications linking candidates to requisitions"""
    STAGE_CHOICES = [
        ('new', 'New'),
        ('screening', 'Resume Screening'),
        ('phone_screen', 'Phone Screen'),
        ('assessment', 'Assessment'),
        ('interview_1', 'First Interview'),
        ('interview_2', 'Second Interview'),
        ('interview_3', 'Final Interview'),
        ('reference_check', 'Reference Check'),
        ('offer_pending', 'Offer Pending'),
        ('offer_sent', 'Offer Sent'),
        ('offer_accepted', 'Offer Accepted'),
        ('offer_rejected', 'Offer Rejected'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('on_hold', 'On Hold'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('converted', 'Converted to Employee'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    requisition = models.ForeignKey(JobRequisition, on_delete=models.CASCADE, related_name='applications')

    # Application details
    applied_at = models.DateTimeField(auto_now_add=True)
    cover_letter = models.TextField(blank=True)
    answers = models.JSONField(default=dict, blank=True)  # Screening questions

    # Pipeline stage
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='new')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Scoring
    ai_match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    recruiter_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Ownership
    assigned_recruiter = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='assigned_applications')

    # Timeline
    stage_history = models.JSONField(default=list)  # Track stage changes with timestamps

    # Decision
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='rejected_applications')
    rejection_reason = models.TextField(blank=True)
    rejection_stage = models.CharField(max_length=20, blank=True)

    # Conversion
    converted_to_employee = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                              null=True, blank=True, related_name='source_application')
    converted_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'applications'
        unique_together = ['candidate', 'requisition']
        ordering = ['-applied_at']


class Interview(models.Model):
    """Interview scheduling"""
    INTERVIEW_TYPES = [
        ('phone', 'Phone'),
        ('video', 'Video Call'),
        ('in_person', 'In Person'),
        ('panel', 'Panel'),
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('case_study', 'Case Study'),
    ]

    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES)
    stage = models.CharField(max_length=20)  # Maps to application stage

    # Schedule
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    location = models.CharField(max_length=255, blank=True)  # Room or video link
    video_link = models.URLField(blank=True)

    # Participants
    interviewers = models.ManyToManyField('employees.Employee', related_name='interviews_conducted')
    scheduled_by = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                     related_name='scheduled_interviews')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    # Feedback
    feedback_submitted = models.BooleanField(default=False)
    feedback_deadline = models.DateTimeField(null=True, blank=True)

    # Overall assessment
    recommendation = models.CharField(max_length=20, blank=True,
                                      choices=[('strong_hire', 'Strong Hire'),
                                               ('hire', 'Hire'),
                                               ('neutral', 'Neutral'),
                                               ('reject', 'Reject'),
                                               ('strong_reject', 'Strong Reject')])
    overall_comments = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interviews'
        ordering = ['-scheduled_at']


class InterviewFeedback(models.Model):
    """Individual interviewer feedback"""
    RATING_CHOICES = [(i, i) for i in range(1, 6)]  # 1-5 scale

    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedbacks')
    interviewer = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)

    # Competency ratings
    technical_skills = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    communication = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    problem_solving = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    cultural_fit = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    experience_relevance = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)

    # Overall
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    recommendation = models.CharField(max_length=20, choices=[
        ('strong_hire', 'Strong Hire'), ('hire', 'Hire'),
        ('neutral', 'Neutral'), ('reject', 'Reject'), ('strong_reject', 'Strong Reject')
    ])
    comments = models.TextField(blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    is_submitted = models.BooleanField(default=False)

    class Meta:
        db_table = 'interview_feedback'
        unique_together = ['interview', 'interviewer']


class OfferLetter(models.Model):
    """Offer management"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('negotiating', 'Negotiating'),
        ('expired', 'Expired'),
        ('withdrawn', 'Withdrawn'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='offer')

    # Offer details
    proposed_joining_date = models.DateField()
    actual_joining_date = models.DateField(null=True, blank=True)

    # Compensation
    annual_ctc = models.DecimalField(max_digits=12, decimal_places=2)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2)
    variable_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Benefits
    benefits_details = models.JSONField(default=dict)
    special_terms = models.TextField(blank=True)

    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    prepared_by = models.ForeignKey('employees.Employee', on_delete=models.PROTECT,
                                    related_name='prepared_offers')
    approved_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_offers')

    # Sent
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_via = models.CharField(max_length=20, blank=True)  # email, portal
    expiry_date = models.DateField()

    # Response
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Documents
    offer_document = models.FileField(upload_to='offers/%Y/%m/', blank=True)
    signed_document = models.FileField(upload_to='offers/signed/%Y/%m/', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'offer_letters'
        ordering = ['-created_at']