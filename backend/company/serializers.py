from rest_framework import serializers
from .models import CompanySettings, CompanyBranding, AuditLog

class CompanySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class CompanyBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBranding
        fields = '__all__'
        read_only_fields = ['company']

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
