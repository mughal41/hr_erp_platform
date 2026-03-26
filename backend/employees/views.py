from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from guardian.shortcuts import get_objects_for_user

from django.utils import timezone

from .models import Employee, EmployeeDocument, CompensationHistory
from organization.models import Department, JobTitle
from .serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateSerializer,
    DepartmentSerializer, JobTitleSerializer, EmployeeDocumentSerializer, CompensationHistorySerializer
)
from .permissions import CanViewEmployee, CanManageEmployee


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    Employee management API
    """
    queryset = Employee.objects.filter(is_deleted=False)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'employment_status', 'employment_type', 'location']
    search_fields = ['first_name', 'last_name', 'employee_number', 'work_email']
    ordering_fields = ['date_of_joining', 'last_name', 'created_at']
    ordering = ['-date_of_joining']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, CanManageEmployee]
        else:
            permission_classes = [permissions.IsAuthenticated, CanViewEmployee]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # HR and superusers see all
        if user.is_hr_admin or user.is_superuser:
            return queryset

        # Managers see self + direct reports
        if user.employee_profile.is_manager:
            return queryset.filter(
                models.Q(id=user.employee_profile.id) |
                models.Q(manager=user.employee_profile)
            )

        # Regular employees see only self
        return queryset.filter(id=user.employee_profile.id)

    @action(detail=True, methods=['get'])
    def direct_reports(self, request, pk=None):
        """Get all direct reports for an employee"""
        employee = self.get_object()
        reports = employee.direct_reports.filter(is_deleted=False)
        serializer = EmployeeListSerializer(reports, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def org_chart(self, request, pk=None):
        """Get organizational chart data"""
        employee = self.get_object()
        data = {
            'employee': EmployeeDetailSerializer(employee).data,
            'manager': EmployeeListSerializer(employee.manager).data if employee.manager else None,
            'direct_reports': EmployeeListSerializer(
                employee.direct_reports.filter(is_deleted=False), many=True
            ).data
        }
        return Response(data)

    @action(detail=False, methods=['post'], url_path='bulk-registration')
    def bulk_registration(self, request):
        """Bulk register multiple employees at once"""
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of employee records'}, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction
        from accounts.models import User

        results = {'created': 0, 'errors': []}

        with transaction.atomic():
            for idx, item in enumerate(data):
                serializer = EmployeeCreateSerializer(data=item)
                if serializer.is_valid():
                    email = item.get('work_email') or item.get('personal_email')
                    employee_number = item.get('employee_number')
                    
                    if not email or not employee_number:
                        results['errors'].append({'index': idx, 'error': 'Work email and employee number are required'})
                        continue
                        
                    # Create User first
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'employee_id': employee_number,
                            'first_name': item.get('first_name'),
                            'last_name': item.get('last_name'),
                            'is_active': True
                        }
                    )
                    if created:
                        user.set_password('Welcome@123') # Default password for bulk import
                        user.save()
                    
                    # Create employee profile
                    serializer.save(user=user)
                    results['created'] += 1
                else:
                    results['errors'].append({'index': idx, 'errors': serializer.errors})

        return Response(results, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.deleted_by = self.request.user.employee_profile
        instance.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Department management API
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class JobTitleViewSet(viewsets.ModelViewSet):
    """
    JobTitle management API
    """
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    permission_classes = [permissions.IsAuthenticated]


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    """
    Employee documents API
    """
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewEmployee]

    def get_queryset(self):
        user = self.request.user
        if user.is_hr_admin or user.is_superuser:
            return EmployeeDocument.objects.all()
        if hasattr(user, 'employee_profile'):
            return EmployeeDocument.objects.filter(employee=user.employee_profile)
        return EmployeeDocument.objects.none()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user.employee_profile)


class CompensationHistoryViewSet(viewsets.ModelViewSet):
    """
    Compensation history API
    """
    serializer_class = CompensationHistorySerializer
    permission_classes = [permissions.IsAuthenticated, CanViewEmployee]

    def get_queryset(self):
        user = self.request.user
        if user.is_hr_admin or user.is_superuser:
            return CompensationHistory.objects.all()
        if hasattr(user, 'employee_profile'):
            return CompensationHistory.objects.filter(employee=user.employee_profile)
        return CompensationHistory.objects.none()