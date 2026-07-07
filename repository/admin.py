from django.contrib import admin
from django.utils.html import format_html
from .models import Department, Course, Resource, StudentProfile


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'course_count']
    search_fields = ['name']
    
    def course_count(self, obj):
        return obj.courses.count()
    course_count.short_description = 'Courses'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department']
    list_filter = ['department']
    search_fields = ['code', 'name']


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'year_of_study', 'semester', 'resource_type', 'is_approved', 'upload_date', 'download_count']
    list_filter = ['is_approved', 'resource_type', 'year_of_study', 'semester', 'course__department']
    search_fields = ['title', 'course__code', 'course__name', 'uploaded_by__username']
    readonly_fields = ['upload_date', 'download_count', 'approved_date']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'course', 'resource_type')
        }),
        ('Academic Metadata', {
            'fields': ('year_of_study', 'semester')
        }),
        ('File', {
            'fields': ('file_pdf',)
        }),
        ('Status', {
            'fields': ('is_approved', 'approved_by', 'approved_date')
        }),
        ('Statistics', {
            'fields': ('download_count', 'upload_date')
        }),
    )
    
    actions = ['approve_resources']
    
    def approve_resources(self, request, queryset):
        count = 0
        for resource in queryset:
            if not resource.is_approved:
                resource.approve(request.user)
                count += 1
        self.message_user(request, f'{count} resources approved successfully.')
    approve_resources.short_description = 'Approve selected resources'
    
    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.uploaded_by:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'student_id', 'department', 'current_year']
    list_filter = ['department', 'current_year']
    search_fields = ['user__username', 'student_id']