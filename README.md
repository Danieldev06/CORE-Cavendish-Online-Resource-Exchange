# CORE - Cavendish Online Resource Exchange

##  Project Overview

CORE (Cavendish Online Resource Exchange) is a centralized web-based institutional knowledge repository designed to address the persistent challenges of academic resource sharing at Cavendish University Zambia.

##  Problem Statement

Junior students at Cavendish University Zambia currently rely on informal, inefficient peer-to-peer networks to access lecture notes, past papers, and other academic materials. This system leads to:
- Delayed responses from senior students
- Incomplete or outdated resources
- Permanent loss of materials when students graduate
- Limited ability to study ahead

##  Solution

CORE provides a digital platform where students can:
-  Search and filter resources by faculty, course, year, and semester
-  Upload lecture notes, past papers, dissertations, and articles
-  Access verified content approved by lecturers
-  See faculty-specific content only

##  Features

- **Role-Based Access Control**: Faculty-specific content filtering
- **Resource Verification**: Lecturer approval workflow
- **Advanced Search**: Filter by department, course, year, semester, and resource type
- **Faculty-Specific Content**: Users only see resources from their faculty
- **Shared Modules**: Cross-faculty resources marked as shared
- **Responsive Design**: Works on desktop, tablet, and mobile

##  Technology Stack

- **Backend**: Django 6.0 (Python)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript
- **File Storage**: Local media storage

##  Installation

### Prerequisites
- Python 3.8+
- pip
- Git

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/CORE-Cavendish-Online-Resource-Exchange.git
cd CORE-Cavendish-Online-Resource-Exchange

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver