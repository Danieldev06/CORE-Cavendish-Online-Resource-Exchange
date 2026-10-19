from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ============================================================
# DEPARTMENT MODEL
# ============================================================
class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# ============================================================
# PROGRAM MODEL
# ============================================================
class Program(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.code} - {self.name} ({self.department.name})"

    class Meta:
        ordering = ['department', 'name']


# ============================================================
# CHOICES
# ============================================================
RESOURCE_TYPES = [
    ('NOTES', 'Lecture Notes'),
    ('PASTPAPER', 'Past Exam Paper'),
    ('DISSERTATION', 'Approved Dissertation'),
    ('ARTICLE', 'Research Article'),
]

YEAR_CHOICES = [
    (1, 'Year 1'),
    (2, 'Year 2'),
    (3, 'Year 3'),
    (4, 'Year 4'),
    (5, 'Year 5'),
    (6, 'Year 6'),
]

SEMESTER_CHOICES = [
    (1, 'Semester 1'),
    (2, 'Semester 2'),
]

ROLE_CHOICES = [
    ('student', 'Student'),
    ('lecturer', 'Lecturer'),
    ('admin', 'Librarian / Admin'),
]


# ============================================================
# COURSE MODEL
# ============================================================
class Course(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_department(self):
        return self.department

    class Meta:
        ordering = ['code']


# ============================================================
# RESOURCE MODEL
# ============================================================
class Resource(models.Model):
    title = models.CharField(max_length=300)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    year_of_study = models.IntegerField(choices=YEAR_CHOICES)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    file_pdf = models.FileField(upload_to='resources/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_resources')
    approved_date = models.DateTimeField(null=True, blank=True)
    is_shared = models.BooleanField(default=False, help_text="If checked, visible to ALL faculties")
    is_archived = models.BooleanField(default=False, help_text="If checked, hidden from main listings")
    archived_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='archived_resources')
    archived_date = models.DateTimeField(null=True, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    download_count = models.IntegerField(default=0)

    # New fields for better frontend integration
    description = models.TextField(blank=True, help_text="Abstract or detailed description of the resource")
    keywords = models.JSONField(default=list, blank=True, help_text="Searchable keywords/tags")
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")

    def __str__(self):
        return self.title

    def increment_download(self):
        self.download_count += 1
        self.save(update_fields=['download_count'])

    def approve(self, user):
        self.is_approved = True
        self.approved_by = user
        self.approved_date = timezone.now()
        self.save()

    def archive(self, user):
        self.is_archived = True
        self.archived_by = user
        self.archived_date = timezone.now()
        self.save(update_fields=['is_archived', 'archived_by', 'archived_date'])

    def unarchive(self, user):
        self.is_archived = False
        self.archived_by = user
        self.archived_date = timezone.now()
        self.save(update_fields=['is_archived', 'archived_by', 'archived_date'])

    class Meta:
        ordering = ['-upload_date']


# ============================================================
# STUDENT PROFILE MODEL (with role)
# ============================================================
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    student_id = models.CharField(max_length=20, unique=True)
    profile_image = models.ImageField(upload_to='profile_photos/%Y/%m/%d/', blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student',
    )  # ← NEW
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    current_year = models.IntegerField(choices=YEAR_CHOICES, default=1)
    phone_number = models.CharField(max_length=15, blank=True)
    
    # Additional fields for admin user management
    staff_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')
    submissions_count = models.IntegerField(default=0)
    downloads_count = models.IntegerField(default=0)
    bookmarks_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.student_id} ({self.get_role_display()})"

    def get_faculty_name(self):
        return self.department.name if self.department else "No Faculty Assigned"

    def get_program_name(self):
        return self.program.name if self.program else "No Program Assigned"


# ============================================================
# LECTURER COURSE ASSIGNMENT MODEL
# ============================================================
class LecturerCourse(models.Model):
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lecturer_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lecturer_assignments')
    assigned_date = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_lecturer_courses')
    removed_date = models.DateTimeField(null=True, blank=True)
    removed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='removed_lecturer_courses')

    class Meta:
        unique_together = ['lecturer', 'course']
        indexes = [
            models.Index(fields=['lecturer', 'removed_date']),
            models.Index(fields=['course', 'removed_date']),
        ]
        ordering = ['-assigned_date']

    @property
    def is_active(self):
        return self.removed_date is None

    def __str__(self):
        status = "Active" if self.is_active else "Removed"
        return f"{self.lecturer.username} - {self.course.code} ({status})"


# ============================================================
# SUBMISSION MODEL
# ============================================================
class Submission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('revision_requested', 'Revision Requested'),
        ('published', 'Published'),
    ]

    resource = models.OneToOneField(Resource, on_delete=models.SET_NULL, null=True, blank=True, related_name='submission')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    title = models.CharField(max_length=300)
    abstract = models.TextField(blank=True)
    keywords = models.JSONField(default=list)
    file_pdf = models.FileField(upload_to='submissions/%Y/%m/%d/')
    file_size = models.PositiveIntegerField()
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='submissions')
    year_of_study = models.IntegerField(choices=YEAR_CHOICES)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    academic_year = models.CharField(max_length=20)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions')
    review_comments = models.TextField(blank=True)
    reviewed_date = models.DateTimeField(null=True, blank=True)
    download_count = models.IntegerField(default=0)

    submitted_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.student.username} ({self.get_status_display()})"

    class Meta:
        ordering = ['-submitted_date']


# ============================================================
# NOTIFICATION MODEL
# ============================================================
class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    read = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)
    actionView = models.CharField(max_length=50, blank=True)
    actionParams = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


# ============================================================
# DOWNLOAD LOG MODEL
# ============================================================
class DownloadLog(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='download_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['resource', '-downloaded_at']),
            models.Index(fields=['user', '-downloaded_at']),
        ]
        ordering = ['-downloaded_at']

    def __str__(self):
        return f"{self.resource.title} - {self.user.username if self.user else 'Anonymous'} - {self.downloaded_at}"