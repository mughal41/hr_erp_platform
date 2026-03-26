from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveCalendar, CompOffRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    available = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['id', 'status', 'current_approver', 'manager_action_at', 'hr_action_at', 'requested_at', 'updated_at', 'approved_at', 'cancelled_at']

class LeaveCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveCalendar
        fields = '__all__'

class CompOffRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompOffRequest
        fields = '__all__'
        read_only_fields = ['status', 'approved_by']
