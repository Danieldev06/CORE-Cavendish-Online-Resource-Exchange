from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Public Pages
    path('', views.landing_page, name='landing'),
    path('about/', views.about, name='about'),
    path('features/', views.features, name='features'),
    path('register/', views.register, name='register'),
    
    # Authentication
    path('login/', auth_views.LoginView.as_view(template_name='repository/login.html'), name='login'),
    path('logout/', views.logout_view, name='logout'),  # ← CHANGED THIS LINE
    
    # Protected Pages (Dashboard)
    path('dashboard/', views.home, name='home'),
    path('upload/', views.upload_resource, name='upload'),
    path('download/<int:resource_id>/', views.download_resource, name='download'),
]