from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout  # ← Added logout here
from django.contrib import messages
from django.db.models import Q
from django.http import HttpResponse, Http404
from django.core.paginator import Paginator
from django.contrib.auth.models import User
import os

from .models import Department, Course, Resource
from .forms import ResourceUploadForm, SearchForm, RegistrationForm


# ============================================================
# PUBLIC PAGES (No login required)
# ============================================================

def landing_page(request):
    """Public landing page - first thing visitors see"""
    total_resources = Resource.objects.filter(is_approved=True).count()
    total_departments = Department.objects.count()
    total_courses = Course.objects.count()
    total_users = User.objects.count()
    
    # Get featured resources (most downloaded, limit to 6)
    featured_resources = Resource.objects.filter(
        is_approved=True
    ).order_by('-download_count')[:6]
    
    context = {
        'total_resources': total_resources,
        'total_departments': total_departments,
        'total_courses': total_courses,
        'total_users': total_users,
        'featured_resources': featured_resources,
    }
    return render(request, 'repository/landing.html', context)


def about(request):
    """Public about page"""
    return render(request, 'repository/about.html')


def features(request):
    """Public features page"""
    return render(request, 'repository/features.html')


def register(request):
    """User registration with faculty selection"""
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Log the user in after registration
            login(request, user)
            messages.success(request, 'Account created successfully! Welcome to CORE.')
            return redirect('home')
    else:
        form = RegistrationForm()
    
    context = {'form': form}
    return render(request, 'repository/register.html', context)


# ============================================================
# 🔥 NEW: CUSTOM LOGOUT VIEW
# ============================================================

def logout_view(request):
    """
    Custom logout view that handles GET requests.
    Logs out the user and redirects to the landing page.
    """
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('landing')


# ============================================================
# DASHBOARD / HOME PAGE (Requires login)
# ============================================================

@login_required
def home(request):
    """
    Dashboard for authenticated users - shows resources filtered by their faculty.
    """
    departments = Department.objects.all()
    
    # Start with all approved resources
    resources = Resource.objects.filter(is_approved=True)
    courses = Course.objects.none()
    user_faculty = None
    
    # Get user's faculty from profile
    try:
        if hasattr(request.user, 'profile') and request.user.profile.department:
            user_faculty = request.user.profile.department
            # Show resources from user's department OR shared resources
            resources = resources.filter(
                Q(course__department=user_faculty) | Q(is_shared=True)
            )
            # Get courses from user's department for the filter dropdown
            courses = Course.objects.filter(
                Q(department=user_faculty) | Q(resources__is_shared=True)
            ).distinct()
    except:
        # If no profile, show only shared resources
        resources = resources.filter(is_shared=True)
        messages.warning(request, 'Please complete your profile to see faculty-specific content.')
    
    # Build the search form
    form = SearchForm(request.GET or None)
    
    # Get filter parameters
    dept_id = request.GET.get('department')
    course_id = request.GET.get('course')
    year = request.GET.get('year_of_study')
    semester = request.GET.get('semester')
    resource_type = request.GET.get('resource_type')
    search_query = request.GET.get('q')
    
    # Apply filters
    if dept_id:
        resources = resources.filter(course__department_id=dept_id)
        courses = Course.objects.filter(department_id=dept_id)
    
    if course_id:
        resources = resources.filter(course_id=course_id)
    
    if year:
        resources = resources.filter(year_of_study=year)
    
    if semester:
        resources = resources.filter(semester=semester)
    
    if resource_type:
        resources = resources.filter(resource_type=resource_type)
    
    if search_query:
        resources = resources.filter(
            Q(title__icontains=search_query) |
            Q(course__code__icontains=search_query) |
            Q(course__name__icontains=search_query)
        )
    
    # Pagination (show 10 per page)
    paginator = Paginator(resources, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'departments': departments,
        'courses': courses,
        'resources': page_obj,
        'form': form,
        'selected_dept': dept_id,
        'selected_course': course_id,
        'selected_year': year,
        'selected_semester': semester,
        'selected_type': resource_type,
        'search_query': search_query,
        'total_count': resources.count(),
        'user_faculty': user_faculty.name if user_faculty else 'All Faculties',
    }
    
    return render(request, 'repository/home.html', context)


# ============================================================
# UPLOAD RESOURCE (Requires login, faculty-restricted)
# ============================================================

@login_required
def upload_resource(request):
    """
    Upload page - only shows courses from the user's faculty.
    """
    user_dept = None
    courses = Course.objects.none()
    
    # Get user's faculty
    try:
        if hasattr(request.user, 'profile') and request.user.profile.department:
            user_dept = request.user.profile.department
            # Superusers can see all courses
            if request.user.is_superuser:
                courses = Course.objects.all()
            else:
                courses = Course.objects.filter(department=user_dept)
        else:
            messages.warning(request, 'Please complete your profile before uploading.')
            return redirect('home')
    except:
        messages.warning(request, 'Please complete your profile before uploading.')
        return redirect('home')
    
    if request.method == 'POST':
        form = ResourceUploadForm(request.POST, request.FILES)
        if form.is_valid():
            resource = form.save(commit=False)
            resource.uploaded_by = request.user
            resource.is_approved = False  # Needs lecturer approval
            
            # Validate that the course belongs to the user's faculty
            if not request.user.is_superuser:
                if resource.course.department != user_dept:
                    messages.error(request, 'You can only upload resources for courses in your faculty.')
                    return redirect('upload')
            
            # Try to get student profile for display name
            try:
                if hasattr(request.user, 'profile'):
                    resource.uploaded_by_name = f"{request.user.username} ({request.user.profile.student_id})"
            except:
                resource.uploaded_by_name = request.user.username
            
            resource.save()
            messages.success(request, '✅ Resource uploaded successfully! Waiting for lecturer approval.')
            return redirect('home')
    else:
        form = ResourceUploadForm()
        # Restrict course choices to user's faculty
        if not request.user.is_superuser:
            form.fields['course'].queryset = courses
    
    context = {
        'form': form,
        'courses': courses,
        'user_faculty': user_dept.name if user_dept else 'None',
    }
    return render(request, 'repository/upload.html', context)


# ============================================================
# DOWNLOAD RESOURCE (Requires login)
# ============================================================

@login_required
def download_resource(request, resource_id):
    """
    Download a resource - only if it's approved and belongs to user's faculty or is shared.
    """
    resource = get_object_or_404(Resource, id=resource_id, is_approved=True)
    
    # Check if user has access to this resource
    user_dept = None
    try:
        if hasattr(request.user, 'profile'):
            user_dept = request.user.profile.department
    except:
        pass
    
    # If user has a faculty and resource is not shared and not in their faculty
    if user_dept and not resource.is_shared and resource.course.department != user_dept:
        if not request.user.is_superuser:
            messages.error(request, 'You do not have access to this resource.')
            return redirect('home')
    
    # Increment download count
    resource.increment_download()
    
    # Serve the file
    file_path = resource.file_pdf.path
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
            return response
    else:
        raise Http404("File not found.")