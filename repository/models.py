from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# ============================================================
# DEPARTMENT MODEL
# ============================================================
class Department(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


# ============================================================
# COURSE MODEL
# ============================================================
class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        ordering = ['code']


# ============================================================
# RESOURCE TYPE CHOICES
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


# ============================================================
# RESOURCE MODEL (MAIN)
# ============================================================
class Resource(models.Model):
    # Basic Information
    title = models.CharField(max_length=300)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    
    # Academic Metadata
    year_of_study = models.IntegerField(choices=YEAR_CHOICES)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    
    # File
    file_pdf = models.FileField(upload_to='resources/%Y/%m/%d/')
    
    # User Information
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)  # For display purposes
    
    # Status
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_resources')
    approved_date = models.DateTimeField(null=True, blank=True)
    
    #  NEW: Shared across all faculties
    is_shared = models.BooleanField(
        default=False, 
        help_text="If checked, this resource is visible to ALL faculties (e.g., shared modules)"
    )
    
    # Timestamps
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    # Statistics
    download_count = models.IntegerField(default=0)
    
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
    
    class Meta:
        ordering = ['-upload_date']


# ============================================================
# STUDENT PROFILE MODEL
# ============================================================
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    student_id = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    current_year = models.IntegerField(choices=YEAR_CHOICES, default=1)
    phone_number = models.CharField(max_length=15, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.student_id}"
    
    def get_faculty_name(self):
        """Helper method to get faculty name safely"""
        return self.department.name if self.department else "No Faculty Assigned"