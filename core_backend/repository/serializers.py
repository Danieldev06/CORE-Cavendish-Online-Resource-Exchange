from rest_framework import serializers
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Department, Program, Course, Resource, StudentProfile, LecturerCourse, Submission, Notification


# ============================================================
# DATA SERIALIZERS
# ============================================================

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model = Program
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    program_name = serializers.ReadOnlyField(source='program.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    department_code = serializers.ReadOnlyField(source='department.code')
    class Meta:
        model = Course
        fields = '__all__'


class ResourceSerializer(serializers.ModelSerializer):
    course_code = serializers.ReadOnlyField(source='course.code')
    course_name = serializers.ReadOnlyField(source='course.name')
    uploaded_by_username = serializers.ReadOnlyField(source='uploaded_by.username')
    department_name = serializers.ReadOnlyField(source='course.department.name')
    program_name = serializers.ReadOnlyField(source='course.program.name')
    class Meta:
        model = Resource
        fields = '__all__'


# ============================================================
# AUTH SERIALIZERS
# ============================================================

class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    student_id = serializers.CharField(max_length=20)
    faculty = serializers.CharField(max_length=20, required=False, allow_blank=True)
    program = serializers.CharField(max_length=50, required=False, allow_blank=True)
    year = serializers.CharField(max_length=5, required=False, allow_blank=True)
    role = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        valid_domains = [
            '@cavendish.ac.zm',
            '@students.cavendish.ac.zm',
            '@cavendish.co.zm',
            '@students.cavendish.co.zm',
        ]
        if not any(value.endswith(d) for d in valid_domains):
            raise serializers.ValidationError(
                'Please use a Cavendish University email address.'
            )
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_student_id(self, value):
        if StudentProfile.objects.filter(student_id=value).exists():
            raise serializers.ValidationError('This ID is already registered.')
        return value

    def validate_role(self, value):
        if value not in ['student', 'lecturer', 'admin']:
            raise serializers.ValidationError(
                'Invalid role. Must be student, lecturer, or admin.'
            )
        return value

    def validate(self, data):
        role = data.get('role')
        if role == 'lecturer':
            if not data.get('faculty'):
                raise serializers.ValidationError({'faculty': 'Lecturers must select a faculty/department.'})
        elif role == 'student':
            if not data.get('faculty'):
                raise serializers.ValidationError({'faculty': 'Students must select a faculty/department.'})
            if not data.get('program'):
                raise serializers.ValidationError({'program': 'Students must select a programme.'})
            if not data.get('year'):
                raise serializers.ValidationError({'year': 'Students must select a year of study.'})
        return data

    def create(self, validated_data):
        role = validated_data['role']

        # Create the user
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )

        # Admins/librarians get staff access to Django admin panel
        if role == 'admin':
            user.is_staff = True
            user.save()

        # Look up department and program by code (only if provided)
        department = None
        program = None
        if validated_data.get('faculty'):
            department = Department.objects.filter(code=validated_data['faculty']).first()
        if validated_data.get('program'):
            program = Program.objects.filter(code=validated_data['program']).first()

        # For lecturers: only department is required; program/year are not used
        # For students: department, program, year are all required
        # For admins: none are required
        current_year = 1
        if role == 'student' and validated_data.get('year'):
            current_year = int(validated_data['year'])

        # Create the profile
        StudentProfile.objects.create(
            user=user,
            student_id=validated_data['student_id'],
            role=role,
            department=department,
            program=program if role == 'student' else None,
            current_year=current_year,
        )

        # Create auth token
        Token.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ============================================================
# PASSWORD RESET SERIALIZERS
# ============================================================

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        valid_domains = [
            '@cavendish.ac.zm',
            '@students.cavendish.ac.zm',
            '@cavendish.co.zm',
            '@students.cavendish.co.zm',
        ]
        if not any(value.endswith(d) for d in valid_domains):
            raise serializers.ValidationError(
                'Please use a Cavendish University email address.'
            )
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No account found with this email address.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'faculty', 'program', 'year', 'student_id', 'profile_image',
        ]

    def get_role(self, obj):
        """Return the role stored on the profile."""
        try:
            return obj.profile.role
        except Exception:
            return 'admin' if obj.is_staff else 'student'

    def get_faculty(self, obj):
        try:
            return obj.profile.department.code if obj.profile.department else ''
        except Exception:
            return ''

    def get_program(self, obj):
        try:
            return obj.profile.program.code if obj.profile.program else ''
        except Exception:
            return ''

    def get_year(self, obj):
        try:
            return obj.profile.current_year
        except Exception:
            return 1

    def get_student_id(self, obj):
        try:
            return obj.profile.student_id
        except Exception:
            return ''

    def get_profile_image(self, obj):
        try:
            if not obj.profile.profile_image:
                return ''
            request = self.context.get('request')
            return request.build_absolute_uri(obj.profile.profile_image.url) if request else obj.profile.profile_image.url
        except Exception:
            return ''


# ============================================================
# ADMIN USER SERIALIZER
# ============================================================

class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management view."""
    role = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    staff_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format='%Y-%m-%d')
    submissions_count = serializers.SerializerMethodField()
    downloads_count = serializers.SerializerMethodField()
    bookmarks_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'faculty', 'program', 'year', 'student_id', 'staff_id',
            'status', 'date_joined', 'submissions_count', 'downloads_count', 'bookmarks_count',
        ]

    def get_role(self, obj):
        """Return the role stored on the profile."""
        try:
            return obj.profile.role
        except Exception:
            return 'admin' if obj.is_staff else 'student'

    def get_faculty(self, obj):
        try:
            return obj.profile.department.name if obj.profile.department else ''
        except Exception:
            return ''

    def get_program(self, obj):
        try:
            return obj.profile.program.name if obj.profile.program else ''
        except Exception:
            return ''

    def get_year(self, obj):
        try:
            return obj.profile.current_year
        except Exception:
            return 1

    def get_student_id(self, obj):
        try:
            return obj.profile.student_id
        except Exception:
            return ''

    def get_staff_id(self, obj):
        try:
            return obj.profile.staff_id
        except Exception:
            return ''

    def get_status(self, obj):
        try:
            return obj.profile.status
        except Exception:
            return 'active' if obj.is_active else 'inactive'

    def get_submissions_count(self, obj):
        try:
            return obj.profile.submissions_count
        except Exception:
            return 0

    def get_downloads_count(self, obj):
        try:
            return obj.profile.downloads_count
        except Exception:
            return 0

    def get_bookmarks_count(self, obj):
        try:
            return obj.profile.bookmarks_count
        except Exception:
            return 0


# ============================================================
# LECTURER COURSE SERIALIZERS
# ============================================================

class LecturerCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), write_only=True, source='course'
    )
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = LecturerCourse
        fields = ['id', 'course', 'course_id', 'assigned_date', 'assigned_by', 'removed_date', 'removed_by', 'is_active']
        read_only_fields = ['assigned_date', 'assigned_by', 'removed_date', 'removed_by', 'is_active']


class LecturerCourseAssignSerializer(serializers.Serializer):
    course_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='List of course IDs to assign to the lecturer'
    )


# ============================================================
# SUBMISSION SERIALIZERS
# ============================================================

class SubmissionSerializer(serializers.ModelSerializer):
    course_code = serializers.ReadOnlyField(source='course.code')
    course_name = serializers.ReadOnlyField(source='course.name')
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    department_name = serializers.ReadOnlyField(source='course.department.name')
    program_name = serializers.ReadOnlyField(source='course.program.name')
    resource = ResourceSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def get_student_email(self, obj):
        return obj.student.email

    def get_reviewer_name(self, obj):
        if obj.reviewer:
            return f"{obj.reviewer.first_name} {obj.reviewer.last_name}".strip() or obj.reviewer.username
        return None


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            'title', 'abstract', 'keywords', 'file_pdf', 'resource_type',
            'course', 'year_of_study', 'semester', 'academic_year',
        ]

    def validate_file_pdf(self, file):
        import os
        if file.size > 50 * 1024 * 1024:
            raise serializers.ValidationError('File must be under 50MB.')
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ['.pdf', '.doc', '.docx']:
            raise serializers.ValidationError('Only PDF, DOC, and DOCX files are allowed.')
        return file

    def validate_course(self, course):
        user = self.context['request'].user
        profile = getattr(user, 'profile', None)
        if not profile or profile.role != 'student':
            raise serializers.ValidationError('Only students can submit work.')
        if not profile.program:
            raise serializers.ValidationError('No program assigned to your account.')
        if course.program_id != profile.program_id:
            raise serializers.ValidationError('You can only submit for courses in your program.')
        return course

    def create(self, validated_data):
        user = self.context['request'].user
        file = validated_data['file_pdf']
        validated_data['student'] = user
        validated_data['file_size'] = file.size
        validated_data['academic_year'] = validated_data.get('academic_year', '2025/2026')
        return super().create(validated_data)


class SubmissionReviewSerializer(serializers.Serializer):
    DECISION_CHOICES = [
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('revision_requested', 'Request Revision'),
    ]
    decision = serializers.ChoiceField(choices=DECISION_CHOICES)
    comments = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        decision = data['decision']
        comments = data.get('comments', '').strip()
        if decision in ['reject', 'revision_requested'] and not comments:
            raise serializers.ValidationError({'comments': 'Comments are required for rejection or revision requests.'})
        return data


# ============================================================
# NOTIFICATION SERIALIZER
# ============================================================

class NotificationSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user_id', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'userId', 'title', 'message', 'type', 'read', 'date', 'actionView', 'actionParams']
        read_only_fields = fields