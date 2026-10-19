from django.urls import path
from . import views

urlpatterns = [
    # ============================================================
    # PUBLIC API ENDPOINTS
    # ============================================================
    path('api/departments/', views.get_departments, name='api_departments'),
    path('api/programs/', views.get_programs, name='api_programs'),
    path('api/courses/', views.get_courses, name='api_courses'),
    path('api/resources/', views.get_resources, name='api_resources'),
    path('api/resources/<int:resource_id>/', views.get_resource_detail, name='api_resource_detail'),

    # ============================================================
    # AUTH ENDPOINTS
    # ============================================================
    path('api/auth/register/', views.register_view, name='api_register'),
    path('api/auth/login/', views.login_view, name='api_login'),
    path('api/auth/logout/', views.logout_view, name='api_logout'),
    path('api/auth/me/', views.me_view, name='api_me'),
    path('api/auth/profile-image/', views.profile_image_upload, name='api_profile_image_upload'),
    path('api/auth/password-reset/', views.password_reset_request, name='api_password_reset_request'),
    path('api/auth/password-reset/confirm/', views.password_reset_confirm, name='api_password_reset_confirm'),

    # ============================================================
    # RESOURCE UPLOAD ENDPOINTS (Authenticated)
    # ============================================================
    path('api/resources/create/', views.create_resource, name='api_resource_create'),
    path('api/resources/<int:resource_id>/update/', views.update_resource, name='api_resource_update'),
    path('api/resources/<int:resource_id>/delete/', views.delete_resource, name='api_resource_delete'),
    path('api/resources/<int:resource_id>/download/', views.resource_download, name='api_resource_download'),
    path('api/resources/<int:resource_id>/file/', views.resource_file, name='api_resource_file'),
    path('api/resources/<int:resource_id>/signed-url/', views.generate_signed_file_url, name='api_generate_signed_file_url'),
    path('api/resources/<int:resource_id>/signed-file/', views.signed_resource_file, name='api_signed_resource_file'),
    path('api/lecturer/resources/', views.lecturer_resources, name='api_lecturer_resources'),

    # ============================================================
    # STUDENT ENDPOINTS
    # ============================================================
    path('api/student/courses/', views.student_courses, name='api_student_courses'),

    # ============================================================
    # SUBMISSION ENDPOINTS
    # ============================================================
    path('api/submissions/', views.submission_list, name='api_submission_list'),
    path('api/submissions/create/', views.submission_create, name='api_submission_create'),
    path('api/submissions/my/', views.my_submissions, name='api_my_submissions'),
    path('api/submissions/<int:pk>/', views.submission_detail, name='api_submission_detail'),
    path('api/submissions/<int:pk>/review/', views.review_submission, name='api_review_submission'),
    path('api/submissions/<int:pk>/delete/', views.delete_submission, name='api_submission_delete'),
    path('api/submissions/<int:pk>/download/', views.submission_download, name='api_submission_download'),
    path('api/submissions/<int:pk>/file/', views.submission_file, name='api_submission_file'),

    # ============================================================
    # LECTURER COURSE MANAGEMENT ENDPOINTS
    # ============================================================
    path('api/lecturer/courses/', views.lecturer_courses_list, name='api_lecturer_courses_list'),
    path('api/lecturer/courses/available/', views.lecturer_courses_available, name='api_lecturer_courses_available'),
    path('api/lecturer/courses/assign/', views.lecturer_courses_assign, name='api_lecturer_courses_assign'),
    path('api/lecturer/courses/<int:pk>/', views.lecturer_course_remove, name='api_lecturer_course_remove'),

    # ============================================================
    # ADMIN LECTURER COURSE MANAGEMENT ENDPOINTS
    # ============================================================
    path('api/admin/lecturers/<int:lecturer_id>/courses/', views.admin_lecturer_courses, name='api_admin_lecturer_courses'),

    # ============================================================
    # ADMIN USER MANAGEMENT ENDPOINTS
    # ============================================================
    path('api/admin/users/', views.admin_users, name='api_admin_users'),
    path('api/admin/users/<int:user_id>/', views.admin_users, name='api_admin_user_update'),

    # ============================================================
    # ADMIN RESOURCE MANAGEMENT ENDPOINTS
    # ============================================================
    path('api/admin/resources/', views.admin_resources, name='api_admin_resources'),
    path('api/admin/resources/<int:resource_id>/action/', views.admin_resource_action, name='api_admin_resource_action'),
    path('api/admin/resources/<int:resource_id>/update/', views.admin_resource_update, name='api_admin_resource_update'),

    # ============================================================
    # NOTIFICATION ENDPOINTS
    # ============================================================
    path('api/notifications/', views.notification_list, name='api_notification_list'),
    path('api/notifications/<int:pk>/read/', views.mark_notification_read, name='api_mark_notification_read'),
    path('api/notifications/read-all/', views.mark_all_notifications_read, name='api_mark_all_notifications_read'),
    path('api/notifications/<int:pk>/', views.delete_notification, name='api_delete_notification'),
    path('api/notifications/clear/', views.delete_all_notifications, name='api_delete_all_notifications'),
]