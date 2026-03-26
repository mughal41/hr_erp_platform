from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    SalaryStructure, EmployeeSalary, PayrollPeriod,
    Payslip, SalaryAdvance, Reimbursement
)
from .serializers import (
    SalaryStructureSerializer, EmployeeSalarySerializer, PayrollPeriodSerializer,
    PayslipSerializer, SalaryAdvanceSerializer, ReimbursementSerializer
)

class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSalary.objects.all()
    serializer_class = EmployeeSalarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return EmployeeSalary.objects.filter(employee=user.employee_profile)
        return EmployeeSalary.objects.none()

class PayrollPeriodViewSet(viewsets.ModelViewSet):
    queryset = PayrollPeriod.objects.all()
    serializer_class = PayrollPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def process_payroll(self, request, pk=None):
        period = self.get_object()
        if period.status != 'open':
            return Response({'error': 'Can only process open periods'}, status=400)
            
        period.status = 'processing'
        period.processed_at = timezone.now()
        if hasattr(request.user, 'employee_profile'):
            period.processed_by = request.user.employee_profile
        period.save()
        
        # Here we would typically trigger a Celery task to actually generate payslips
        # for all active employees. We'll leave it simple for now.
        return Response({'message': 'Payroll processing started'}, status=200)

class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return Payslip.objects.filter(employee=user.employee_profile, is_published=True)
        return Payslip.objects.none()

    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        payslip = self.get_object()
        payslip.calculate_net_salary()
        payslip.status = 'calculated'
        payslip.save()
        return Response(PayslipSerializer(payslip).data)

class SalaryAdvanceViewSet(viewsets.ModelViewSet):
    queryset = SalaryAdvance.objects.all()
    serializer_class = SalaryAdvanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return SalaryAdvance.objects.filter(employee=user.employee_profile)
        return SalaryAdvance.objects.none()

class ReimbursementViewSet(viewsets.ModelViewSet):
    queryset = Reimbursement.objects.all()
    serializer_class = ReimbursementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return Reimbursement.objects.filter(employee=user.employee_profile)
        return Reimbursement.objects.none()
