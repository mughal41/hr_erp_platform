from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanySettingsView, CompanyBrandingView, AuditLogViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('settings/', CompanySettingsView.as_view(), name='company-settings'),
    path('branding/', CompanyBrandingView.as_view(), name='company-branding'),
    path('', include(router.urls)),
]
