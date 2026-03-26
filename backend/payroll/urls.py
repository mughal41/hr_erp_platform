from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalaryStructureViewSet, EmployeeSalaryViewSet, PayrollPeriodViewSet,
    PayslipViewSet, SalaryAdvanceViewSet, ReimbursementViewSet
)

router = DefaultRouter()
router.register(r'structures', SalaryStructureViewSet, basename='salarystructure')
router.register(r'employee-salary', EmployeeSalaryViewSet, basename='employeesalary')
router.register(r'periods', PayrollPeriodViewSet, basename='payrollperiod')
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'advances', SalaryAdvanceViewSet, basename='salaryadvance')
router.register(r'reimbursements', ReimbursementViewSet, basename='reimbursement')

urlpatterns = [
    path('', include(router.urls)),
]
