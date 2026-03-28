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

    @action(detail=True, methods=['post'], url_path='bulk-update-quota')
    def bulk_update_quota(self, request, pk=None):
        if not getattr(request.user, 'is_hr_admin', False) and not request.user.is_superuser:
            return Response({'error': 'Only HR Admins can update quotas.'}, status=403)
            
        leave_type = self.get_object()
        new_quota = request.data.get('annual_quota')
        
        if new_quota is None:
            return Response({'error': 'annual_quota is required'}, status=400)
            
        # Update LeaveType
        leave_type.annual_quota = new_quota
        leave_type.save()
        
        # Update all balances for the current year
        current_year = timezone.now().year
        balances = LeaveBalance.objects.filter(leave_type=leave_type, year=current_year)
        
        for balance in balances:
            balance.opening_balance = new_quota
            balance.save()
            
        return Response({
            'message': f'Updated quota for {leave_type.name} and {balances.count()} employee balances.',
            'annual_quota': new_quota
        })

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
            return LeaveRequest.objects.all()
            
        queryset = LeaveRequest.objects.none()
        if hasattr(user, 'employee_profile'):
            # Own requests
            own_requests = LeaveRequest.objects.filter(employee=user.employee_profile)
            # Team requests if manager
            if getattr(user, 'is_manager', False):
                team_requests = LeaveRequest.objects.filter(employee__manager=user.employee_profile)
                queryset = (own_requests | team_requests).distinct()
            else:
                queryset = own_requests
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            employee=self.request.user.employee_profile,
            status='pending'
        )

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if not getattr(user, 'is_hr_admin', False) and not user.is_superuser:
            if instance.status != 'pending':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Cannot edit this request because it is no longer pending.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not getattr(user, 'is_hr_admin', False) and not user.is_superuser:
            if instance.status != 'pending':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Cannot delete this request because it is no longer pending.")
        instance.delete()

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
            # Deduct balance is now handled by the model's save() method
                
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
