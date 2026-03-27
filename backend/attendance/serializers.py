from rest_framework import serializers
from .models import (
    WorkSchedule, EmployeeSchedule, AttendanceRecord,
    TimeEntry, ShiftPattern, ShiftAssignment, OvertimeRequest, AttendanceRequest
)

# ... existing serializers ...

class AttendanceRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRequest
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'manager_approved_at', 'hr_approved_at']


class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = '__all__'

class EmployeeScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSchedule
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_worked', 'overtime', 'late_by', 'early_leave_by']

class TimeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeEntry
        fields = '__all__'

class ShiftPatternSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftPattern
        fields = '__all__'

class ShiftAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftAssignment
        fields = '__all__'

class OvertimeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRequest
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'manager_approved_at', 'hr_approved_at']
