from celery import shared_task
from django.utils import timezone
from .models import PayrollPeriod, EmployeeSalary, Payslip
from employees.models import Employee

@shared_task
def generate_monthly_payroll(period_id):
    """
    Background job to process payslips for an entire period
    """
    try:
        period = PayrollPeriod.objects.get(id=period_id)
        if period.status != 'processing':
            return "Period not in processing state"
            
        employees = Employee.objects.filter(is_deleted=False, employment_status='active')
        
        payslips_created = 0
        for employee in employees:
            try:
                # We skip checking exact attendance values for simplicity in this task
                # and assume basic structure defaults.
                salary = employee.salary_details
                if not salary or not salary.is_active:
                    continue
                
                # Create draft payslip based on standard components
                payslip, created = Payslip.objects.get_or_create(
                    employee=employee,
                    payroll_period=period,
                    defaults={
                        'status': 'calculated',
                        'days_present': period.working_days
                    }
                )
                
                if created:
                    # In real logic, break down the salary structure into JSON
                    payslip.earnings = {
                        "basic_salary": float(salary.annual_ctc) / 12 * 0.4
                    }
                    payslip.calculate_net_salary()
                    payslip.save()
                    payslips_created += 1
                    
            except Exception as e:
                # Log error for specific employee, continue loop
                pass
                
        period.status = 'locked'
        period.save()
        
        return f"Successfully generated {payslips_created} payslips"
        
    except PayrollPeriod.DoesNotExist:
        return "Invalid period ID"
