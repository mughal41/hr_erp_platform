from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    WorkSchedule, EmployeeSchedule, AttendanceRecord,
    TimeEntry, ShiftPattern, ShiftAssignment, OvertimeRequest, AttendanceRequest
)
from .serializers import (
    WorkScheduleSerializer, EmployeeScheduleSerializer, AttendanceRecordSerializer,
    TimeEntrySerializer, ShiftPatternSerializer, ShiftAssignmentSerializer, OvertimeRequestSerializer,
    AttendanceRequestSerializer
)

# ... existing ViewSets ...

class AttendanceRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRequest.objects.all()
    serializer_class = AttendanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return AttendanceRequest.objects.all()
            
        queryset = AttendanceRequest.objects.none()
        if hasattr(user, 'employee_profile'):
            # Own requests
            own_requests = AttendanceRequest.objects.filter(employee=user.employee_profile)
            # Team requests if manager
            if getattr(user, 'is_manager', False):
                team_requests = AttendanceRequest.objects.filter(employee__manager=user.employee_profile)
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
            
            # Reconciliation logic
            from datetime import datetime
            
            record, created = AttendanceRecord.objects.get_or_create(
                employee=req.employee,
                date=req.date
            )
            
            if req.morning_punch is not None:
                record.check_in = datetime.combine(req.date, req.morning_punch)
            if req.leaving_punch is not None:
                record.check_out = datetime.combine(req.date, req.leaving_punch)
                
            record.is_manual_entry = True
            if req.reason:
                if record.manual_entry_reason:
                    record.manual_entry_reason += "\\n" + req.reason
                else:
                    record.manual_entry_reason = req.reason
                    
            if record.status in ['absent', 'pending', '']:
                record.status = 'present'
            
            # Extract break updates
            b_start = datetime.combine(req.date, req.break_start_punch) if req.break_start_punch is not None else None
            b_end = datetime.combine(req.date, req.break_end_punch) if req.break_end_punch is not None else None
            
            if b_start or b_end:
                time_entry, _ = TimeEntry.objects.get_or_create(
                    attendance=record,
                    entry_type='break',
                    defaults={
                        'start_time': b_start or timezone.now(),
                        'description': 'Manual break entry from attendance request'
                    }
                )
                if b_start is not None:
                    time_entry.start_time = b_start
                if b_end is not None:
                    time_entry.end_time = b_end
                time_entry.save()
                
                if time_entry.start_time and time_entry.end_time:
                    record.break_duration = time_entry.end_time - time_entry.start_time
            
            record.save()
            
            # Recalculate metrics
            try:
                record.calculate_metrics()
                record.save()
            except Exception:
                pass
                
        req.save()
        return Response(AttendanceRequestSerializer(req).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = 'rejected'
        req.save()
        return Response(AttendanceRequestSerializer(req).data)


class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmployeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSchedule.objects.all()
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_hr_admin', False) or user.is_superuser:
            return super().get_queryset()
        if hasattr(user, 'employee_profile'):
            return AttendanceRecord.objects.filter(employee=user.employee_profile)
        return AttendanceRecord.objects.none()

    @action(detail=False, methods=['get'], url_path='by-date')
    def by_date(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date parameter is required'}, status=400)
            
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'No employee profile linked'}, status=400)
            
        employee = request.user.employee_profile
        try:
            record = AttendanceRecord.objects.get(employee=employee, date=date_str)
            
            breaks = TimeEntry.objects.filter(attendance=record, entry_type='break').order_by('start_time')
            break_start = None
            break_end = None
            if breaks.exists():
                b = breaks.first()
                break_start = b.start_time.strftime('%H:%M') if b.start_time else None
                break_end = b.end_time.strftime('%H:%M') if b.end_time else None
                
            return Response({
                'morning_punch': record.check_in.strftime('%H:%M') if record.check_in else None,
                'break_start_punch': break_start,
                'break_end_punch': break_end,
                'leaving_punch': record.check_out.strftime('%H:%M') if record.check_out else None,
            })
        except AttendanceRecord.DoesNotExist:
            return Response({
                'morning_punch': None,
                'break_start_punch': None,
                'break_end_punch': None,
                'leaving_punch': None,
            })

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'No employee profile linked.'}, status=400)
            
        employee = request.user.employee_profile
        today = timezone.now().date()
        record, created = AttendanceRecord.objects.get_or_create(
            employee=employee, date=today
        )
        if record.check_in:
            return Response({'message': 'Already clocked in'}, status=status.HTTP_400_BAD_REQUEST)
        
        record.check_in = timezone.now()
        record.status = 'present'
        record.save()
        return Response(AttendanceRecordSerializer(record).data)

    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'No employee profile linked.'}, status=400)
            
        employee = request.user.employee_profile
        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
            if not record.check_in:
                return Response({'message': 'Not clocked in yet'}, status=status.HTTP_400_BAD_REQUEST)
            if record.check_out:
                return Response({'message': 'Already clocked out'}, status=status.HTTP_400_BAD_REQUEST)
            
            record.check_out = timezone.now()
            # Try to calculate metrics if schedule linked
            try:
                record.calculate_metrics()
            except Exception:
                pass
            record.save()
            return Response(AttendanceRecordSerializer(record).data)
        except AttendanceRecord.DoesNotExist:
            return Response({'message': 'No attendance record for today'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        """Get attendance analytics for dashboard"""
        from django.db.models import Count, Avg, Q
        from datetime import timedelta
        
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        # 1. Today's stats
        total_present = AttendanceRecord.objects.filter(date=today, status='present').count()
        total_absent = AttendanceRecord.objects.filter(date=today, status='absent').count()
        late_arrivals = AttendanceRecord.objects.filter(date=today, status='late').count()
        
        # 2. Trends (last 30 days)
        # Handle cases where status is 'late' separately if needed, but here we count 'present' or 'late' as present
        daily_stats = AttendanceRecord.objects.filter(
            date__gte=last_30_days
        ).values('date').annotate(
            present_count=Count('id', filter=Q(status__in=['present', 'late', 'early_leave'])),
            late_count=Count('id', filter=Q(status='late'))
        ).order_by('date')
        
        # 3. Average working hours (converting duration to hours)
        avg_worked = AttendanceRecord.objects.filter(
            date__gte=last_30_days, 
            total_worked__isnull=False
        ).aggregate(avg=Avg('total_worked'))['avg']
        
        avg_hours = 0
        if avg_worked:
            avg_hours = avg_worked.total_seconds() / 3600
        
        return Response({
            'today': {
                'present': total_present + late_arrivals,
                'absent': total_absent,
                'late': late_arrivals
            },
            'trends': daily_stats,
            'average_working_hours': round(float(avg_hours), 2)
        })

class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

class ShiftPatternViewSet(viewsets.ModelViewSet):
    queryset = ShiftPattern.objects.all()
    serializer_class = ShiftPatternSerializer
    permission_classes = [permissions.IsAuthenticated]

class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class OvertimeRequestViewSet(viewsets.ModelViewSet):
    queryset = OvertimeRequest.objects.all()
    serializer_class = OvertimeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'approved'
        if getattr(request.user, 'is_manager', False):
            req.manager_approved_at = timezone.now()
            req.manager = request.user.employee_profile
        if getattr(request.user, 'is_hr_admin', False):
            req.hr_approved_at = timezone.now()
            req.hr_approved_by = request.user.employee_profile
        req.save()
        return Response(OvertimeRequestSerializer(req).data)
