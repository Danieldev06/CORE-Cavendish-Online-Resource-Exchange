from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Q
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.shortcuts import redirect, get_object_or_404
from django.http import FileResponse

from .models import Department, Program, Course, Resource, StudentProfile, LecturerCourse, Submission, DownloadLog, Notification
from .serializers import (
    DepartmentSerializer, ProgramSerializer, CourseSerializer,
    ResourceSerializer, RegisterSerializer, LoginSerializer,
    UserProfileSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, AdminUserSerializer,
    LecturerCourseSerializer, LecturerCourseAssignSerializer,
    SubmissionSerializer, SubmissionCreateSerializer, SubmissionReviewSerializer,
    NotificationSerializer,
)


# ============================================================
# PUBLIC API ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_departments(request):
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_programs(request):
    dept_id = request.GET.get('department')
    if dept_id:
        programs = Program.objects.filter(department_id=dept_id)
    else:
        programs = Program.objects.all()
    serializer = ProgramSerializer(programs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_courses(request):
    program_id = request.GET.get('program')
    if program_id:
        courses = Course.objects.filter(program_id=program_id)
    else:
        courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_resources(request):
    resources = Resource.objects.filter(is_approved=True)

    # Filter by department (ID or code)
    dept_id = request.GET.get('department')
    if dept_id:
        # Try numeric ID first, fall back to code
        if dept_id.isdigit():
            resources = resources.filter(course__program__department_id=dept_id)
        else:
            resources = resources.filter(course__program__department__code=dept_id)

    # Filter by program (ID or code)
    program_id = request.GET.get('program')
    if program_id:
        if program_id.isdigit():
            resources = resources.filter(course__program_id=program_id)
        else:
            resources = resources.filter(course__program__code=program_id)

    # Filter by programme name (exact match)
    programme = request.GET.get('programme')
    if programme:
        resources = resources.filter(course__program__name=programme)

    # Filter by course
    course_id = request.GET.get('course')
    if course_id:
        if course_id.isdigit():
            resources = resources.filter(course_id=course_id)
        else:
            resources = resources.filter(course__code=course_id)

    # Filter by year
    year = request.GET.get('year')
    if year:
        resources = resources.filter(year_of_study=year)

    # Filter by semester
    semester = request.GET.get('semester')
    if semester:
        resources = resources.filter(semester=semester)

    # Filter by type
    resource_type = request.GET.get('type')
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

    # Search by keyword
    search = request.GET.get('search')
    if search:
        resources = resources.filter(
            Q(title__icontains=search) |
            Q(course__code__icontains=search) |
            Q(course__name__icontains=search) |
            Q(keywords__icontains=search)
        )

    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_resource_detail(request, resource_id):
    try:
        resource = Resource.objects.get(id=resource_id, is_approved=True)
        serializer = ResourceSerializer(resource)
        return Response(serializer.data)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND,
        )


# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserProfileSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        account = User.objects.filter(email=email).first()
        if account and not account.is_active:
            return Response(
                {'error': 'This account has been deactivated. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = authenticate(username=email, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user, context={'request': request}).data,
            })
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# PASSWORD RESET ENDPOINTS
# ============================================================

# Simple in-memory rate limiting (use Redis in production)
_password_reset_attempts = {}

def _check_rate_limit(email: str, max_attempts: int = 3, window_minutes: int = 60) -> tuple[bool, int]:
    """Check if email has exceeded rate limit for password reset requests."""
    import time
    now = time.time()
    window_seconds = window_minutes * 60
    
    if email not in _password_reset_attempts:
        _password_reset_attempts[email] = []
    
    # Clean old attempts outside the window
    _password_reset_attempts[email] = [
        attempt_time for attempt_time in _password_reset_attempts[email]
        if now - attempt_time < window_seconds
    ]
    
    if len(_password_reset_attempts[email]) >= max_attempts:
        # Return seconds until next attempt allowed
        oldest = _password_reset_attempts[email][0]
        retry_after = int(window_seconds - (now - oldest)) + 1
        return False, retry_after
    
    return True, 0


def _send_password_reset_email(user, uid: str, token: str, request):
    """Send password reset email to user."""
    from django.conf import settings
    from django.core.mail import send_mail
    from django.template.loader import render_to_string
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:8443')
    reset_link = f"{frontend_url}/forgot-password?uid={uid}&token={token}"
    
    subject = 'CORE Repository - Password Reset Request'
    
    # Plain text version
    message = f"""
Hello {user.get_full_name() or user.username},

You requested a password reset for your CORE Repository account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you didn't request this, please ignore this email or contact library@cavendish.ac.zm for assistance.

Best regards,
CORE Repository Team
Cavendish University Zambia
"""
    
    # HTML version
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">CORE Repository</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Cavendish Online Resource Exchange</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e3a5f; margin-top: 0;">Password Reset Request</h2>
        
        <p>Hello <strong>{user.get_full_name() or user.username}</strong>,</p>
        
        <p>You requested a password reset for your CORE Repository account. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Your Password
            </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="{reset_link}" style="color: #3b82f6; word-break: break-all;">{reset_link}</a>
        </p>
        
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ This link expires in 1 hour.</strong> For security, please reset your password promptly.
            </p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't request this, please ignore this email or contact <a href="mailto:library@cavendish.ac.zm" style="color: #3b82f6;">library@cavendish.ac.zm</a> for assistance.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            CORE Repository Team<br>
            Cavendish University Zambia<br>
            Library & Academic Resources
        </p>
    </div>
</body>
</html>
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log the error but don't expose it to the user
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email to {user.email}: {e}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Request a password reset.
    Sends a reset link to the user's email.
    """
    # Rate limiting
    email = request.data.get('email', '').lower()
    allowed, retry_after = _check_rate_limit(email)
    if not allowed:
        return Response(
            {'error': f'Too many requests. Please try again in {retry_after} seconds.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Record the attempt
        import time
        if email not in _password_reset_attempts:
            _password_reset_attempts[email] = []
        _password_reset_attempts[email].append(time.time())
        
        # Generate token using Django's default token generator
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send email
        email_sent = _send_password_reset_email(user, uid, token, request)
        
        if email_sent:
            return Response({
                'message': 'Password reset instructions have been sent to your email.',
            })
        else:
            # Email failed but don't expose this to user for security
            return Response({
                'message': 'If an account exists with this email, password reset instructions have been sent.',
            })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset with uid, token, and new password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        uid = request.data.get('uid')
        
        if not uid:
            return Response(
                {'error': 'UID is required to confirm password reset.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            from django.utils.http import urlsafe_base64_decode
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {'error': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Verify the token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired reset token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Set the new password
        user.set_password(new_password)
        user.save()
        
        # Delete any existing tokens for security
        Token.objects.filter(user=user).delete()
        
        return Response({'message': 'Password has been reset successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserProfileSerializer(request.user, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def profile_image_upload(request):
    profile = getattr(request.user, 'profile', None)
    if not profile:
        return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    image = request.FILES.get('profile_image')
    if not image:
        return Response({'error': 'Please select an image.'}, status=status.HTTP_400_BAD_REQUEST)
    if image.size > 5 * 1024 * 1024:
        return Response({'error': 'Image must be 5 MB or smaller.'}, status=status.HTTP_400_BAD_REQUEST)
    if image.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
        return Response({'error': 'Please upload a JPG, PNG, or WebP image.'}, status=status.HTTP_400_BAD_REQUEST)

    profile.profile_image = image
    profile.save(update_fields=['profile_image'])
    return Response(UserProfileSerializer(request.user, context={'request': request}).data)


# ============================================================
# RESOURCE UPLOAD ENDPOINTS (Authenticated)
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_resource(request):
    """
    Upload a new resource.
    - Requires auth token.
    - File saves to media/resources/YYYY/MM/DD/
    - Auto-marks as is_approved=False
    """
    from .serializers import ResourceSerializer as RS

    title = request.data.get('title')
    course_id = request.data.get('course')
    year_of_study = request.data.get('year_of_study')
    semester = request.data.get('semester')
    resource_type = request.data.get('resource_type')
    file = request.FILES.get('file_pdf')
    is_shared = request.data.get('is_shared', 'false').lower() in ['true', '1', 'yes']

    # Basic validation
    errors = {}
    if not title:
        errors['title'] = ['Title is required.']
    if not course_id:
        errors['course'] = ['Course is required.']
    if not file:
        errors['file_pdf'] = ['File is required.']
    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    # Validate course exists
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'course': [f'Course with ID {course_id} does not exist.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Authorization check for lecturers: must have active assignment for this course
    user_profile = getattr(request.user, 'profile', None)
    user_role = (user_profile.role if user_profile else '').lower()
    
    # Fallback: if no profile but user is staff, treat as admin
    if not user_profile and request.user.is_staff:
        user_role = 'admin'
    
    if user_profile and user_role == 'lecturer':
        has_assignment = LecturerCourse.objects.filter(
            lecturer=request.user,
            course_id=course_id,
            removed_date__isnull=True
        ).exists()
        if not has_assignment:
            return Response(
                {'course': ['You are not authorized to upload resources for this course.']},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Authorization check for students: course must belong to their program
    if user_profile and user_role == 'student':
        if not user_profile.program:
            return Response(
                {'course': ['No program assigned to your account. Contact administration.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if course.program_id != user_profile.program_id:
            return Response(
                {'course': ['You can only upload resources for courses in your program.']},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Validate file type and size
    import os
    if file.size > 50 * 1024 * 1024:
        return Response(
            {'file_pdf': ['File must be under 50MB.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ['.pdf', '.doc', '.docx']:
        return Response(
            {'file_pdf': ['Only PDF, DOC, and DOCX files are allowed.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create the resource
    import json
    keywords_data = request.data.get('keywords', '[]')
    try:
        keywords = json.loads(keywords_data) if isinstance(keywords_data, str) else keywords_data
    except (json.JSONDecodeError, TypeError):
        keywords = []

    # Auto-approve for lecturers and admins (they're authorized for their courses)
    # Students go through the approval workflow
    auto_approve = user_role in ['lecturer', 'admin']

    resource = Resource.objects.create(
        title=title,
        course=course,
        year_of_study=int(year_of_study or 1),
        semester=int(semester or 1),
        resource_type=resource_type or 'NOTES',
        file_pdf=file,
        uploaded_by=request.user,
        uploaded_by_name=(
            f"{request.user.first_name} {request.user.last_name}".strip()
            or request.user.username
        ),
        is_approved=auto_approve,
        is_shared=is_shared,
        description=request.data.get('description', ''),
        keywords=keywords,
        file_size=file.size,
    )

    if auto_approve:
        resource.approve(request.user)

    return Response(RS(resource).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecturer_resources(request):
    """
    Return resources uploaded by the current lecturer.
    """
    resources = Resource.objects.filter(uploaded_by=request.user).order_by('-upload_date')
    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_resource(request, resource_id):
    """
    Delete a resource - owner or admin only.
    """
    try:
        resource = Resource.objects.get(id=resource_id)
    except Resource.DoesNotExist:
        return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

    user_profile = getattr(request.user, 'profile', None)
    is_owner = resource.uploaded_by == request.user
    is_admin = user_profile and user_profile.role == 'admin'

    if not (is_owner or is_admin):
        return Response({'error': 'Permission denied. You can only delete your own resources.'}, status=status.HTTP_403_FORBIDDEN)

    resource.delete()
    return Response({'message': 'Resource deleted successfully.'})


# ============================================================
# RESOURCE DOWNLOAD ENDPOINTS
# ============================================================

def _get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _check_resource_access(user, resource):
    """Check if user has permission to access resource."""
    user_profile = getattr(user, 'profile', None)
    
    # Admin/librarian: full access
    if user.is_staff or (user_profile and user_profile.role == 'admin'):
        return True
    
    # Lecturer: assigned courses only
    if user_profile and user_profile.role == 'lecturer':
        has_assignment = LecturerCourse.objects.filter(
            lecturer=user,
            course=resource.course,
            removed_date__isnull=True
        ).exists()
        if has_assignment:
            return True
        # Also allow if they uploaded it
        if resource.uploaded_by == user:
            return True
    
    # Student: same department (faculty) or shared resources
    if user_profile and user_profile.role == 'student':
        if resource.is_shared:
            return True
        # Department-level access (faculty-wide)
        if user_profile.department and resource.course.department_id == user_profile.department_id:
            return True
        # Also allow exact program match
        if user_profile.program and resource.course.program_id == user_profile.program_id:
            return True
    
    # Resource owner
    if resource.uploaded_by == user:
        return True
    
    return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resource_file(request, resource_id):
    """
    Securely serve resource file for preview.
    Checks permissions, then streams file from local storage.
    """
    try:
        resource = get_object_or_404(Resource, id=resource_id, is_approved=True)
        
        if not _check_resource_access(request.user, resource):
            return Response(
                {'error': 'Permission denied. You do not have access to this resource.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log access
        DownloadLog.objects.create(
            resource=resource,
            user=request.user,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        resource.increment_download()
        
        # Stream file from local storage
        file_handle = resource.file_pdf.open('rb')
        ext = resource.file_pdf.name.split('.')[-1].lower()
        
        # Sanitize filename
        import re
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', resource.title)
        filename = re.sub(r'\s+', '_', filename)
        filename = filename[:100] + '.' + ext
        
        # For view action, use inline to enable preview in browser
        # For download action, use attachment
        # The action is determined by the presence of 'download' in query params or referer
        # For this endpoint, default to inline for PDF and download for others
        content_disposition = 'inline' if ext == 'pdf' else 'attachment'
        
        response = FileResponse(file_handle)
        response['Content-Disposition'] = f'{content_disposition}; filename="{filename}"'
        
        # Set proper content type
        if ext == 'pdf':
            response['Content-Type'] = 'application/pdf'
        elif ext in ['doc', 'docx']:
            response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
        return response
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("Error in resource_file")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resource_download(request, resource_id):
    """
    Increment download count and stream file from local storage with forced download.
    """
    resource = get_object_or_404(Resource, id=resource_id, is_approved=True)
    
    if not _check_resource_access(request.user, resource):
        return Response(
            {'error': 'Permission denied. You do not have access to this resource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    resource.increment_download()
    
    # Stream file from local storage
    file_handle = resource.file_pdf.open('rb')
    ext = resource.file_pdf.name.split('.')[-1].lower()
    
    # Sanitize filename
    import re
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', resource.title)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename[:100] + '.' + ext
    
    # Always use attachment for downloads
    response = FileResponse(file_handle)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Content-Type'] = 'application/octet-stream'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request):
    """Return courses in the current student's program."""
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role != 'student':
        return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)
    if not profile.program:
        return Response({'error': 'No program assigned to your account. Contact administration.'}, status=status.HTTP_400_BAD_REQUEST)

    courses = Course.objects.filter(program=profile.program).select_related('department', 'program')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_resource(request, resource_id):
    """Update a resource - same validation as create."""
    try:
        resource = Resource.objects.get(id=resource_id, uploaded_by=request.user)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found or you do not own it.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Validate course if provided
    course_id = request.data.get('course')
    if course_id:
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {'course': [f'Course with ID {course_id} does not exist.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authorization check for lecturers
        user_profile = getattr(request.user, 'profile', None)
        if user_profile and user_profile.role == 'lecturer':
            has_assignment = LecturerCourse.objects.filter(
                lecturer=request.user,
                course_id=course_id,
                removed_date__isnull=True
            ).exists()
            if not has_assignment:
                return Response(
                    {'course': ['You are not authorized to upload resources for this course.']},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Authorization check for students
        if user_profile and user_profile.role == 'student':
            if not user_profile.program:
                return Response(
                    {'course': ['No program assigned to your account. Contact administration.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if course.program_id != user_profile.program_id:
                return Response(
                    {'course': ['You can only upload resources for courses in your program.']},
                    status=status.HTTP_403_FORBIDDEN,
                )

    # Validate file if provided
    file = request.FILES.get('file_pdf')
    if file:
        import os
        if file.size > 50 * 1024 * 1024:
            return Response(
                {'file_pdf': ['File must be under 50MB.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ['.pdf', '.doc', '.docx']:
            return Response(
                {'file_pdf': ['Only PDF, DOC, and DOCX files are allowed.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Parse keywords
    import json
    keywords_data = request.data.get('keywords')
    if keywords_data:
        try:
            keywords = json.loads(keywords_data) if isinstance(keywords_data, str) else keywords_data
        except (json.JSONDecodeError, TypeError):
            keywords = []
        request.data._mutable = True
        request.data['keywords'] = keywords

    # Update the resource
    serializer = ResourceSerializer(resource, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# ============================================================

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_users(request, user_id=None):
    """
    Return all users for admin management.
    Only accessible by admin users.
    """
    # Check if user is admin
    try:
        if request.user.profile.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Exception:
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

    if request.method == 'PATCH':
        if user_id is None:
            return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        target = get_object_or_404(User, id=user_id)
        profile = getattr(target, 'profile', None)
        allowed_fields = {'first_name', 'last_name', 'email'}
        for field in allowed_fields:
            if field in request.data:
                setattr(target, field, request.data[field])
        if profile and 'status' in request.data:
            profile.status = request.data['status']
            target.is_active = request.data['status'] == 'active'
            profile.save(update_fields=['status'])
        target.save()
        return Response(AdminUserSerializer(target).data)

    users = User.objects.all().order_by('-date_joined')
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)


# ============================================================
# ADMIN RESOURCE MANAGEMENT ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_resources(request):
    """
    Return all resources for admin management (including pending, rejected, archived).
    Supports filtering, search, and pagination.
    Only accessible by admin users.
    """
    # Check if user is admin
    user_profile = getattr(request.user, 'profile', None)
    if not (user_profile and user_profile.role == 'admin') and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    resources = Resource.objects.all().select_related(
        'course', 'course__department', 'course__program', 'uploaded_by', 'approved_by', 'archived_by'
    ).order_by('-upload_date')

    # Filters
    search = request.GET.get('search')
    if search:
        resources = resources.filter(
            Q(title__icontains=search) |
            Q(course__code__icontains=search) |
            Q(course__name__icontains=search) |
            Q(keywords__icontains=search) |
            Q(uploaded_by_name__icontains=search)
        )

    resource_type = request.GET.get('type')
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

    status_filter = request.GET.get('status')
    if status_filter:
        if status_filter == 'pending':
            resources = resources.filter(is_approved=False, is_archived=False)
        elif status_filter == 'approved':
            resources = resources.filter(is_approved=True, is_archived=False)
        elif status_filter == 'rejected':
            resources = resources.filter(is_approved=False, is_archived=False)  # or add rejected status
        elif status_filter == 'archived':
            resources = resources.filter(is_archived=True)

    school = request.GET.get('school')
    if school:
        resources = resources.filter(course__department__name=school)

    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    total = resources.count()
    total_pages = (total + page_size - 1) // page_size
    start = (page - 1) * page_size
    end = start + page_size
    resources = resources[start:end]

    serializer = ResourceSerializer(resources, many=True)
    return Response({
        'results': serializer.data,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_resource_action(request, resource_id):
    """
    Perform admin action on a resource: approve, reject, archive, unarchive, delete.
    Only accessible by admin users.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not (user_profile and user_profile.role == 'admin') and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        resource = Resource.objects.get(id=resource_id)
    except Resource.DoesNotExist:
        return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    if not action:
        return Response({'error': 'Action is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'approve':
        if resource.is_archived:
            return Response({'error': 'Cannot approve archived resource. Unarchive first.'}, status=status.HTTP_400_BAD_REQUEST)
        resource.approve(request.user)
        message = 'Resource approved successfully.'
    elif action == 'reject':
        if resource.is_archived:
            return Response({'error': 'Cannot reject archived resource. Unarchive first.'}, status=status.HTTP_400_BAD_REQUEST)
        resource.is_approved = False
        resource.approved_by = request.user
        resource.approved_date = timezone.now()
        resource.save(update_fields=['is_approved', 'approved_by', 'approved_date'])
        message = 'Resource rejected.'
    elif action == 'archive':
        resource.archive(request.user)
        message = 'Resource archived successfully.'
    elif action == 'unarchive':
        resource.unarchive(request.user)
        message = 'Resource unarchived successfully.'
    elif action == 'delete':
        resource.delete()
        return Response({'message': 'Resource deleted successfully.'})
    else:
        return Response({'error': f'Invalid action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ResourceSerializer(resource)
    return Response({'message': message, 'resource': serializer.data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_resource_update(request, resource_id):
    """
    Update resource metadata (admin can edit any resource).
    Only accessible by admin users.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not (user_profile and user_profile.role == 'admin') and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        resource = Resource.objects.get(id=resource_id)
    except Resource.DoesNotExist:
        return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Allowed fields for admin update
    allowed_fields = {
        'title', 'description', 'resource_type', 'is_shared',
        'year_of_study', 'semester', 'course', 'keywords'
    }
    data = {k: v for k, v in request.data.items() if k in allowed_fields}

    # Validate course if provided
    if 'course' in data:
        try:
            course = Course.objects.get(id=data['course'])
            data['course'] = course
        except Course.DoesNotExist:
            return Response({'course': ['Course not found.']}, status=status.HTTP_400_BAD_REQUEST)

    # Parse keywords if provided as string
    if 'keywords' in data and isinstance(data['keywords'], str):
        import json
        try:
            data['keywords'] = json.loads(data['keywords'])
        except (json.JSONDecodeError, TypeError):
            data['keywords'] = []

    serializer = ResourceSerializer(resource, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# LECTURER COURSE MANAGEMENT ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecturer_courses_list(request):
    """
    Return the current lecturer's active course assignments.
    Only accessible by lecturers.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'lecturer':
        return Response(
            {'error': 'Permission denied. Lecturer access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    assignments = LecturerCourse.objects.filter(
        lecturer=request.user,
        removed_date__isnull=True
    ).select_related('course', 'course__department', 'course__program').order_by('course__code')

    serializer = LecturerCourseSerializer(assignments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecturer_courses_available(request):
    """
    Return courses in the lecturer's department that are not yet assigned to them.
    Only accessible by lecturers.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'lecturer':
        return Response(
            {'error': 'Permission denied. Lecturer access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Get courses in lecturer's department
    dept = user_profile.department
    if not dept:
        return Response({'error': 'Lecturer has no department assigned.'}, status=status.HTTP_400_BAD_REQUEST)

    # Get already assigned course IDs (active only)
    assigned_course_ids = LecturerCourse.objects.filter(
        lecturer=request.user,
        removed_date__isnull=True
    ).values_list('course_id', flat=True)

    # Get available courses
    available_courses = Course.objects.filter(
        department=dept
    ).exclude(
        id__in=assigned_course_ids
    ).select_related('department', 'program').order_by('code')

    serializer = CourseSerializer(available_courses, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lecturer_courses_assign(request):
    """
    Assign courses to the current lecturer (bulk).
    Validates that all courses belong to the lecturer's department.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'lecturer':
        return Response(
            {'error': 'Permission denied. Lecturer access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = LecturerCourseAssignSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    course_ids = serializer.validated_data['course_ids']
    dept = user_profile.department

    if not dept:
        return Response({'error': 'Lecturer has no department assigned.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate all courses belong to lecturer's department
    invalid_courses = Course.objects.filter(id__in=course_ids).exclude(department=dept)
    if invalid_courses.exists():
        invalid_codes = list(invalid_courses.values_list('code', flat=True))
        return Response(
            {'error': f'Courses must belong to your department ({dept.name}). Invalid: {", ".join(invalid_codes)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create assignments (skip duplicates)
    created = []
    for course_id in course_ids:
        assignment, created_flag = LecturerCourse.objects.get_or_create(
            lecturer=request.user,
            course_id=course_id,
            defaults={'assigned_by': request.user}
        )
        if created_flag:
            created.append(assignment)
        elif assignment.removed_date:
            # Reactivate if previously removed
            assignment.removed_date = None
            assignment.removed_by = None
            assignment.assigned_by = request.user
            assignment.save()
            created.append(assignment)

    serializer = LecturerCourseSerializer(created, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lecturer_course_remove(request, pk):
    """
    Remove a course assignment (soft delete).
    Only the lecturer who owns the assignment can remove it.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'lecturer':
        return Response(
            {'error': 'Permission denied. Lecturer access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        assignment = LecturerCourse.objects.get(id=pk, lecturer=request.user)
    except LecturerCourse.DoesNotExist:
        return Response(
            {'error': 'Assignment not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if assignment.removed_date:
        return Response(
            {'error': 'Assignment already removed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.utils import timezone
    assignment.removed_date = timezone.now()
    assignment.removed_by = request.user
    assignment.save()

    return Response({'message': 'Course assignment removed successfully.'})


# ============================================================
# NOTIFICATION ENDPOINTS
# ============================================================

def create_submission_notifications(submission):
    lecturer_ids = LecturerCourse.objects.filter(
        course=submission.course,
        removed_date__isnull=True,
    ).values_list('lecturer_id', flat=True)
    admin_ids = StudentProfile.objects.filter(
        role='admin',
    ).values_list('user_id', flat=True)
    recipient_ids = set(lecturer_ids).union(admin_ids)

    if not recipient_ids:
        return 0

    existing_recipient_ids = set(Notification.objects.filter(
        user_id__in=recipient_ids,
        actionView='review-submissions',
        actionParams__submission_id=submission.id,
    ).values_list('user_id', flat=True))
    new_recipient_ids = recipient_ids - existing_recipient_ids

    Notification.objects.bulk_create([
        Notification(
            user_id=user_id,
            title='New Submission Received',
            message=f'{submission.student.get_full_name() or submission.student.username} submitted "{submission.title}" for review.',
            type='info',
            actionView='review-submissions',
            actionParams={'submission_id': submission.id},
        )
        for user_id in new_recipient_ids
    ])
    return len(new_recipient_ids)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """
    List notifications for the current user.
    Query params:
    - unread_only: if 'true', return only unread notifications
    """
    unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
    
    notifications = Notification.objects.filter(user=request.user).order_by('-date')
    
    if unread_only:
        notifications = notifications.filter(read=False)
    
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """
    Mark a single notification as read.
    """
    try:
        notification = Notification.objects.get(id=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    
    notification.read = True
    notification.save(update_fields=['read'])
    
    return Response({'message': 'Notification marked as read.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the current user.
    """
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'message': 'All notifications marked as read.'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    """Delete one notification belonging to the current user."""
    try:
        notification = Notification.objects.get(id=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_notifications(request):
    """Delete all notifications belonging to the current user."""
    Notification.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# SUBMISSION ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def submission_list(request):
    """
    List submissions - accessible by lecturers (their courses) and admins (all).
    """
    user_profile = getattr(request.user, 'profile', None)
    
    # Allow both lecturers and admins
    if not user_profile or user_profile.role not in ['lecturer', 'admin']:
        return Response(
            {'error': 'Permission denied. Lecturer or Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    is_admin = user_profile.role == 'admin'
    
    if is_admin:
        # Admins see all submissions with optional filters
        submissions = Submission.objects.select_related(
            'student', 'course', 'course__department', 'course__program', 'reviewer', 'resource'
        ).order_by('-submitted_date')
        
        # Optional filters for admins
        status_filter = request.GET.get('status')
        if status_filter:
            submissions = submissions.filter(status=status_filter)
            
        course_id = request.GET.get('course')
        if course_id:
            submissions = submissions.filter(course_id=course_id)
            
        department_id = request.GET.get('department')
        if department_id:
            submissions = submissions.filter(course__department_id=department_id)
    else:
        # Lecturers see only their assigned courses
        assigned_course_ids = LecturerCourse.objects.filter(
            lecturer=request.user,
            removed_date__isnull=True
        ).values_list('course_id', flat=True)

        submissions = Submission.objects.filter(
            course_id__in=assigned_course_ids
        ).select_related(
            'student', 'course', 'course__department', 'course__program', 'reviewer', 'resource'
        ).order_by('-submitted_date')

        status_filter = request.GET.get('status')
        if status_filter:
            submissions = submissions.filter(status=status_filter)

    serializer = SubmissionSerializer(submissions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submission_create(request):
    """
    Student submits new work for review.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'student':
        return Response(
            {'error': 'Permission denied. Student access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SubmissionCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        submission = serializer.save()
        # Increment student's submission count
        user_profile.submissions_count += 1
        user_profile.save(update_fields=['submissions_count'])
        create_submission_notifications(submission)
        return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_submissions(request):
    """
    Return submissions by the current student.
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role != 'student':
        return Response(
            {'error': 'Permission denied. Student access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    submissions = Submission.objects.filter(student=request.user).select_related('course', 'course__department', 'course__program', 'reviewer', 'resource').order_by('-submitted_date')
    serializer = SubmissionSerializer(submissions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def submission_detail(request, pk):
    """
    Get submission detail - accessible by owner (student) or assigned lecturer.
    """
    try:
        submission = Submission.objects.select_related(
            'student', 'course', 'course__department', 'course__program', 'reviewer', 'resource'
        ).get(id=pk)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    user_profile = getattr(request.user, 'profile', None)
    is_owner = submission.student == request.user
    is_assigned_lecturer = False

    if user_profile and user_profile.role == 'lecturer':
        is_assigned_lecturer = LecturerCourse.objects.filter(
            lecturer=request.user,
            course=submission.course,
            removed_date__isnull=True
        ).exists()

    if not (is_owner or is_assigned_lecturer or (user_profile and user_profile.role == 'admin')):
        return Response(
            {'error': 'Permission denied.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SubmissionSerializer(submission)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_submission(request, pk):
    """
    Lecturer or Admin reviews a submission (approve/reject/revision).
    """
    user_profile = getattr(request.user, 'profile', None)
    if not user_profile or user_profile.role not in ['lecturer', 'admin']:
        return Response(
            {'error': 'Permission denied. Lecturer or Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    is_admin = user_profile.role == 'admin'

    try:
        submission = Submission.objects.get(id=pk)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verify lecturer is assigned to this course (admins can review any)
    if not is_admin:
        has_assignment = LecturerCourse.objects.filter(
            lecturer=request.user,
            course=submission.course,
            removed_date__isnull=True
        ).exists()

        if not has_assignment:
            return Response(
                {'error': 'You are not assigned to this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

    serializer = SubmissionReviewSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    decision = serializer.validated_data['decision']
    comments = serializer.validated_data.get('comments', '')

    from django.utils import timezone

    if decision == 'approve':
        # Create Resource from Submission
        resource = Resource.objects.create(
            title=submission.title,
            course=submission.course,
            year_of_study=submission.year_of_study,
            semester=submission.semester,
            resource_type=submission.resource_type,
            file_pdf=submission.file_pdf,
            uploaded_by=submission.student,
            uploaded_by_name=f"{submission.student.first_name} {submission.student.last_name}".strip() or submission.student.username,
            is_approved=True,
            is_shared=False,
            description=submission.abstract,
            keywords=submission.keywords,
            file_size=submission.file_size,
        )
        resource.approve(request.user)

        submission.status = 'approved'
        submission.resource = resource
        submission.reviewer = request.user
        submission.review_comments = comments
        submission.reviewed_date = timezone.now()
        submission.save()

        # Create notification for student
        from .models import Notification
        Notification.objects.create(
            user=submission.student,
            title='Submission Approved',
            message=f'Your submission "{submission.title}" has been approved and published to the repository.',
            type='success',
            actionView='my-submissions',
        )

    elif decision == 'reject':
        submission.status = 'rejected'
        submission.reviewer = request.user
        submission.review_comments = comments
        submission.reviewed_date = timezone.now()
        submission.save()

        from .models import Notification
        Notification.objects.create(
            user=submission.student,
            title='Submission Rejected',
            message=f'Your submission "{submission.title}" has been rejected. Reviewer comments: {comments}',
            type='error',
            actionView='my-submissions',
        )

    elif decision == 'revision_requested':
        submission.status = 'revision_requested'
        submission.reviewer = request.user
        submission.review_comments = comments
        submission.reviewed_date = timezone.now()
        submission.save()

        from .models import Notification
        Notification.objects.create(
            user=submission.student,
            title='Revision Requested',
            message=f'Your submission "{submission.title}" requires revision. Reviewer comments: {comments}',
            type='warning',
            actionView='my-submissions',
        )

    submission.save()
    return Response(SubmissionSerializer(submission).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_submission(request, pk):
    """
    Delete a submission - owner (student) or admin only.
    """
    try:
        submission = Submission.objects.get(id=pk)
    except Submission.DoesNotExist:
        return Response({'error': 'Submission not found.'}, status=status.HTTP_404_NOT_FOUND)

    user_profile = getattr(request.user, 'profile', None)
    is_owner = submission.student == request.user
    is_admin = user_profile and user_profile.role == 'admin'

    if not (is_owner or is_admin):
        return Response(
            {'error': 'Permission denied. You can only delete your own submissions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    submission.delete()
    return Response({'message': 'Submission deleted successfully.'})


# ============================================================
# SUBMISSION FILE ENDPOINTS
# ============================================================

def _check_submission_access(user, submission):
    """Check if user has permission to access submission file."""
    user_profile = getattr(user, 'profile', None)
    
    # Admin: full access
    if user.is_staff or (user_profile and user_profile.role == 'admin'):
        return True
    
    # Owner (student): can access their own submission
    if submission.student == user:
        return True
    
    # Assigned lecturer: can access submissions for their courses
    if user_profile and user_profile.role == 'lecturer':
        has_assignment = LecturerCourse.objects.filter(
            lecturer=user,
            course=submission.course,
            removed_date__isnull=True
        ).exists()
        if has_assignment:
            return True
    
    return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submission_download(request, pk):
    """
    Increment download count and stream file from local storage with forced download.
    """
    try:
        submission = Submission.objects.select_related('course', 'student').get(id=pk)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not _check_submission_access(request.user, submission):
        return Response(
            {'error': 'Permission denied. You do not have access to this submission.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Increment download count on submission
    submission.download_count = getattr(submission, 'download_count', 0) + 1
    submission.save(update_fields=['download_count'])
    
    # Stream file from local storage
    file_handle = submission.file_pdf.open('rb')
    ext = submission.file_pdf.name.split('.')[-1].lower()
    
    # Sanitize filename
    import re
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', submission.title)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename[:100] + '.' + ext
    
    # Always use attachment for downloads
    response = FileResponse(file_handle)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Content-Type'] = 'application/octet-stream'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def submission_file(request, pk):
    """
    Securely serve submission file for preview.
    Checks permissions, then streams file from local storage.
    """
    try:
        submission = Submission.objects.select_related('course', 'student').get(id=pk)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not _check_submission_access(request.user, submission):
        return Response(
            {'error': 'Permission denied. You do not have access to this submission.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Stream file from local storage
    file_handle = submission.file_pdf.open('rb')
    ext = submission.file_pdf.name.split('.')[-1].lower()
    
    # Sanitize filename
    import re
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', submission.title)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename[:100] + '.' + ext
    
# For view action, use inline to enable preview in browser
    content_disposition = 'inline' if ext == 'pdf' else 'attachment'
    
    response = FileResponse(file_handle)
    response['Content-Disposition'] = f'{content_disposition}; filename="{filename}"'
    
    # Set proper content type
    if ext == 'pdf':
        response['Content-Type'] = 'application/pdf'
    elif ext in ['doc', 'docx']:
        response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    return response


# ============================================================
# ADMIN LECTURER COURSE MANAGEMENT ENDPOINTS
# ============================================================

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_lecturer_courses(request, lecturer_id):
    """
    Admin endpoint to manage any lecturer's course assignments.
    GET: List all assignments (active + inactive)
    POST: Assign courses to lecturer
    DELETE: Remove assignment
    """
    # Check if user is admin
    try:
        if request.user.profile.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Exception:
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

    try:
        lecturer = User.objects.get(id=lecturer_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Lecturer not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        assignments = LecturerCourse.objects.filter(
            lecturer=lecturer
        ).select_related('course', 'course__department', 'course__program').order_by('-assigned_date')
        serializer = LecturerCourseSerializer(assignments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = LecturerCourseAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_ids = serializer.validated_data['course_ids']

        # Admin can assign any courses (no department restriction)
        created = []
        for course_id in course_ids:
            assignment, created_flag = LecturerCourse.objects.get_or_create(
                lecturer=lecturer,
                course_id=course_id,
                defaults={'assigned_by': request.user}
            )
            if created_flag:
                created.append(assignment)
            elif assignment.removed_date:
                assignment.removed_date = None
                assignment.removed_by = None
                assignment.assigned_by = request.user
                assignment.save()
                created.append(assignment)

        serializer = LecturerCourseSerializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    elif request.method == 'DELETE':
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
            return Response(
                {'error': 'assignment_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assignment = LecturerCourse.objects.get(id=assignment_id, lecturer=lecturer)
        except LecturerCourse.DoesNotExist:
            return Response(
                {'error': 'Assignment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if assignment.removed_date:
            return Response(
                {'error': 'Assignment already removed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        assignment.removed_date = timezone.now()
        assignment.removed_by = request.user
        assignment.save()

        return Response({'message': 'Course assignment removed successfully.'})


# ============================================================
# SIGNED URL FILE ACCESS
# ============================================================

from core.utils.signed_urls import file_access_signer


@api_view(['GET'])
def signed_resource_file(request, resource_id):
    """
    Serve resource file using signed URL (no authentication required).
    Validates signature and serves file with appropriate content disposition.
    
    Query params:
    - sig: Signature from signed URL
    - action: 'view' (inline) or 'download' (attachment)
    """
    sig = request.GET.get('sig')
    action = request.GET.get('action', 'view')
    
    if not sig:
        return Response(
            {'error': 'Missing signature parameter.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if action not in ('view', 'download'):
        return Response(
            {'error': "Invalid action. Must be 'view' or 'download'."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify signature (1 hour expiry)
    if not file_access_signer.verify_signed_url(resource_id, sig, action, max_age=3600):
        return Response(
            {'error': 'Invalid or expired signature.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get resource
    resource = get_object_or_404(Resource, id=resource_id, is_approved=True)
    
    # For signed URLs, we only check if resource exists and is approved
    # The signature itself proves authorization
    
    # Log access
    DownloadLog.objects.create(
        resource=resource,
        user=request.user if request.user.is_authenticated else None,
        ip_address=_get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    resource.increment_download()
    
    # Stream file
    file_handle = resource.file_pdf.open('rb')
    ext = resource.file_pdf.name.split('.')[-1].lower()
    
    # Sanitize filename
    import re
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', resource.title)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename[:100] + '.' + ext
    
    # Content disposition based on action
    content_disposition = 'inline' if action == 'view' and ext == 'pdf' else 'attachment'
    
    response = FileResponse(file_handle)
    response['Content-Disposition'] = f'{content_disposition}; filename="{filename}"'
    
    if ext == 'pdf':
        response['Content-Type'] = 'application/pdf'
    elif ext in ['doc', 'docx']:
        response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        response['Content-Type'] = 'application/octet-stream'
    
    return response


@api_view(['GET', 'POST'])
def generate_signed_file_url(request, resource_id):
    """
    Generate a signed URL for resource file access.
    Requires authentication.
    
    Query params:
    - action: 'view' or 'download' (default: 'view')
    - expires_in: expiry in seconds (default: 3600)
    
    Returns: { "url": "signed_url" }
    """
    # Check authentication
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    resource = get_object_or_404(Resource, id=resource_id, is_approved=True)
    
    # Check if user has access to this resource
    if not _check_resource_access(request.user, resource):
        return Response(
            {'error': 'Permission denied. You do not have access to this resource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    action = request.GET.get('action', 'view')
    if action not in ('view', 'download'):
        action = 'view'
    
    expires_in = int(request.GET.get('expires_in', 3600))
    
    # Generate signed URL
    signed_url = file_access_signer.generate_signed_url(resource_id, action, expires_in)
    
    # Build absolute URL
    base_url = request.build_absolute_uri('/').rstrip('/')
    full_url = base_url + signed_url
    
    return Response({'url': full_url, 'expires_in': 3600})