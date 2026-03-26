from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, DepartmentViewSet, JobTitleViewSet,
    EmployeeDocumentViewSet, CompensationHistoryViewSet
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'job-titles', JobTitleViewSet, basename='jobtitle')
router.register(r'documents', EmployeeDocumentViewSet, basename='document')
router.register(r'compensation', CompensationHistoryViewSet, basename='compensation')

urlpatterns = [
    path('', include(router.urls)),
]