from rest_framework import serializers
from .models import (
    SalaryStructure, EmployeeSalary, PayrollPeriod,
    Payslip, SalaryAdvance, Reimbursement
)

class SalaryStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryStructure
        fields = '__all__'

class EmployeeSalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSalary
        fields = '__all__'
        read_only_fields = ['created_at']

class PayrollPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = '__all__'
        read_only_fields = ['created_at', 'processed_at', 'processed_by']

class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_earnings', 'total_deductions', 'net_salary', 'published_at', 'status']

class SalaryAdvanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryAdvance
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'approved_by', 'approved_at', 'amount_approved']

class ReimbursementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reimbursement
        fields = '__all__'
        read_only_fields = ['status', 'submitted_at', 'reviewer', 'reviewed_at', 'review_notes', 'amount_approved', 'processed_in_payslip']
