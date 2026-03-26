from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from .models import CompanySettings, CompanyBranding, AuditLog
from .serializers import CompanySettingsSerializer, CompanyBrandingSerializer, AuditLogSerializer

class CompanySettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings = CompanySettings.get_settings()
        serializer = CompanySettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if not (request.user.is_superuser or request.user.is_hr_admin):
            return Response(status=status.HTTP_403_FORBIDDEN)
        settings = CompanySettings.get_settings()
        serializer = CompanySettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class CompanyBrandingView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings = CompanySettings.get_settings()
        branding, _ = CompanyBranding.objects.get_or_create(company=settings)
        serializer = CompanyBrandingSerializer(branding)
        return Response(serializer.data)

    def put(self, request):
        if not (request.user.is_superuser or request.user.is_hr_admin):
            return Response(status=status.HTTP_403_FORBIDDEN)
        settings = CompanySettings.get_settings()
        branding, _ = CompanyBranding.objects.get_or_create(company=settings)
        serializer = CompanyBrandingSerializer(branding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser or getattr(self.request.user, 'is_hr_admin', False):
            return super().get_queryset()
        return AuditLog.objects.filter(user=self.request.user)
