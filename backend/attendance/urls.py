from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkScheduleViewSet, EmployeeScheduleViewSet, AttendanceRecordViewSet,
    TimeEntryViewSet, ShiftPatternViewSet, ShiftAssignmentViewSet, OvertimeRequestViewSet,
    AttendanceRequestViewSet
)

router = DefaultRouter()
router.register(r'work-schedules', WorkScheduleViewSet, basename='workschedule')
router.register(r'employee-schedules', EmployeeScheduleViewSet, basename='employeeschedule')
router.register(r'records', AttendanceRecordViewSet, basename='attendance')
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')
router.register(r'shift-patterns', ShiftPatternViewSet, basename='shiftpattern')
router.register(r'shift-assignments', ShiftAssignmentViewSet, basename='shiftassignment')
router.register(r'overtime', OvertimeRequestViewSet, basename='overtime')
router.register(r'requests', AttendanceRequestViewSet, basename='attendancerequest')


urlpatterns = [
    path('', include(router.urls)),
]
