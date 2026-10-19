import os
import sys
sys.path.insert(0, r'C:\Users\jesse\OneDrive\Desktop\Dissertation\academic-institutional-repository\core_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coreapi.settings')
import django
django.setup()
from repository.models import Resource
resources = Resource.objects.all()
for r in resources:
    desc = r.description[:50] if r.description else "empty"
    print(f'{r.id}: {r.title} | desc: {desc} | keywords: {r.keywords} | file_size: {r.file_size}')