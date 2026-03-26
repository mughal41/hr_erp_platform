from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveCalendar, CompOffRequest
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer,
    LeaveCalendarSerializer, CompOffRequestSerializer
)

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return LeaveBalance.objects.filter(employee=user.employee_profile)
        return LeaveBalance.objects.none()

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return LeaveRequest.objects.filter(employee=user.employee_profile)
        return LeaveRequest.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            employee=self.request.user.employee_profile,
            status='pending'
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        user = request.user
        
        if getattr(user, 'is_manager', False):
            req.manager_action_at = timezone.now()
            req.manager = user.employee_profile
            req.status = 'manager_approved'
            
        if getattr(user, 'is_hr_admin', False):
            req.hr_action_at = timezone.now()
            req.hr_representative = user.employee_profile
            req.status = 'approved'
            req.approved_at = timezone.now()
            
            # Deduct balance
            try:
                balance = LeaveBalance.objects.get(
                    employee=req.employee,
                    leave_type=req.leave_type,
                    year=req.start_date.year
                )
                balance.used += req.total_days
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass
                
        req.save()
        return Response(LeaveRequestSerializer(req).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = 'rejected'
        req.save()
        return Response(LeaveRequestSerializer(req).data)

class LeaveCalendarViewSet(viewsets.ModelViewSet):
    queryset = LeaveCalendar.objects.all()
    serializer_class = LeaveCalendarSerializer
    permission_classes = [permissions.IsAuthenticated]

class CompOffRequestViewSet(viewsets.ModelViewSet):
    queryset = CompOffRequest.objects.all()
    serializer_class = CompOffRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return CompOffRequest.objects.filter(employee=user.employee_profile)
        return CompOffRequest.objects.none()
