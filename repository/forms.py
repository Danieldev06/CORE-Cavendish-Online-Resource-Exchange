from django import forms
from django.contrib.auth.models import User
from .models import Resource, RESOURCE_TYPES, YEAR_CHOICES, SEMESTER_CHOICES, Department, StudentProfile


# ============================================================
# RESOURCE UPLOAD FORM
# ============================================================
class ResourceUploadForm(forms.ModelForm):
    class Meta:
        model = Resource
        fields = ['title', 'course', 'year_of_study', 'semester', 'resource_type', 'file_pdf']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter resource title...'}),
            'course': forms.Select(attrs={'class': 'form-select'}),
            'year_of_study': forms.Select(attrs={'class': 'form-select'}),
            'semester': forms.Select(attrs={'class': 'form-select'}),
            'resource_type': forms.Select(attrs={'class': 'form-select'}),
            'file_pdf': forms.FileInput(attrs={'class': 'form-control'}),
        }
    
    def clean_file_pdf(self):
        file = self.cleaned_data.get('file_pdf')
        if file:
            # Check file size (max 50MB)
            if file.size > 50 * 1024 * 1024:
                raise forms.ValidationError('File size must be less than 50MB.')
            
            # Check file extension
            import os
            allowed_extensions = ['.pdf', '.doc', '.docx']
            ext = os.path.splitext(file.name)[1].lower()
            if ext not in allowed_extensions:
                raise forms.ValidationError('Only PDF, DOC, and DOCX files are allowed.')
        
        return file


# ============================================================
# SEARCH FORM
# ============================================================
class SearchForm(forms.Form):
    department = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    course = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    year_of_study = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    semester = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    resource_type = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    q = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Search...'}))
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Populate choices dynamically
        from .models import Department, Course
        self.fields['department'].choices = [('', 'All Departments')] + list(Department.objects.values_list('id', 'name'))
        self.fields['course'].choices = [('', 'All Courses')] + list(Course.objects.values_list('id', 'code'))
        self.fields['year_of_study'].choices = [('', 'Any Year')] + YEAR_CHOICES
        self.fields['semester'].choices = [('', 'Any Semester')] + SEMESTER_CHOICES
        self.fields['resource_type'].choices = [('', 'All Types')] + RESOURCE_TYPES


# ============================================================
# 🔥 NEW: REGISTRATION FORM
# ============================================================
class RegistrationForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        label='Password'
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        label='Confirm Password'
    )
    department = forms.ModelChoiceField(
        queryset=Department.objects.all(),
        empty_label="Select your faculty",
        required=True,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    student_id = forms.CharField(
        max_length=20,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    current_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        required=True,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    class Meta:
        model = User
        fields = ['username', 'email']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords do not match.")
        return cleaned_data

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("This username is already taken.")
        return username

    def clean_student_id(self):
        student_id = self.cleaned_data.get('student_id')
        if StudentProfile.objects.filter(student_id=student_id).exists():
            raise forms.ValidationError("This Student ID is already registered.")
        return student_id

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
            # Create StudentProfile
            StudentProfile.objects.create(
                user=user,
                student_id=self.cleaned_data['student_id'],
                department=self.cleaned_data['department'],
                current_year=self.cleaned_data['current_year']
            )
        return user