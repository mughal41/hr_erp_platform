import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from company.models import CompanySettings
from organization.models import Department, JobTitle
from employees.models import Employee
from django.utils import timezone

def seed():
    # 1. Create Superuser
    email = 'admin@example.com'
    password = 'adminpassword123'
    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(
            email=email,
            password=password,
            employee_id='ADM001',
            first_name='Admin',
            last_name='User'
        )
        print(f"Superuser created: {email} / {password}")
    else:
        print("Superuser already exists.")

    # 2. Create Company Settings (Singleton)
    company, created = CompanySettings.objects.get_or_create(
        id=1,
        defaults={
            'name': 'Antigravity HR Corp',
            'legal_name': 'Antigravity HR Solutions Pvt Ltd',
            'company_type': 'enterprise',
            'email': 'contact@antigravity.corp',
            'phone': '+1234567890',
            'address_line1': '123 Tech Lane',
            'city': 'Innovate City',
            'state': 'Silicon',
            'postal_code': '12345',
            'country': 'US'
        }
    )
    if created:
        print("Company settings created.")

    # 3. Create Department
    dept, created = Department.objects.get_or_create(
        name='Engineering',
        defaults={'code': 'ENG'}
    )
    if created:
        print("Engineering department created.")

    # 4. Create Job Title
    job, created = JobTitle.objects.get_or_create(
        title='Senior Software Engineer',
        defaults={
            'department': dept,
            'code': 'SR_ENG_001',
            'summary': 'Responsible for developing core platform features.'
        }
    )
    if created:
        print("Job Title created.")

    # 5. Create Employee for the superuser
    user = User.objects.get(email=email)
    if not hasattr(user, 'employee_profile'):
        Employee.objects.create(
            user=user,
            employee_number='EMP001',
            first_name='Admin',
            last_name='User',
            date_of_birth='1990-01-01',
            date_of_joining=timezone.now().date(),
            department=dept,
            job_title=job,
            work_email=email,
            gender='male',
            marital_status='single',
            address_line1='123 Tech Lane',
            city='Innovate City',
            state='Silicon',
            postal_code='123456',
            country='US'
        )
        print("Employee profile created for admin.")

if __name__ == '__main__':
    seed()
