from rest_framework import serializers
from .models import Employee, EmployeeDocument, CompensationHistory
from organization.models import Department, JobTitle


class EmployeeListSerializer(serializers.ModelSerializer):
    """Light serializer for list views"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    job_title_name = serializers.CharField(source='job_title.title', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'employee_number', 'first_name', 'last_name', 'full_name',
                  'work_email', 'department_name', 'job_title_name', 'manager_name',
                  'employment_status', 'date_of_joining', 'is_active']


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    department = serializers.PrimaryKeyRelatedField(read_only=True)
    job_title = serializers.PrimaryKeyRelatedField(read_only=True)
    manager = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Employee
        exclude = ['is_deleted', 'deleted_at', 'deleted_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employees"""
    personal_email = serializers.EmailField(required=False)

    class Meta:
        model = Employee
        exclude = ['is_deleted', 'deleted_at', 'deleted_by', 'user']

    def validate(self, data):
        # Add validation logic
        if data.get('date_of_joining') and data.get('date_of_birth'):
            if data['date_of_joining'] < data['date_of_birth']:
                raise serializers.ValidationError("Joining date cannot be before date of birth")
        return data


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class JobTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobTitle
        fields = '__all__'


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        exclude = ['is_verified', 'verified_by', 'verified_at']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'file_size', 'mime_type']

    def create(self, validated_data):
        # file_size and mime_type are extracted from the file in the view ideally
        file = validated_data.get('file')
        if file:
            validated_data['file_size'] = file.size
            validated_data['mime_type'] = file.content_type
        return super().create(validated_data)


class CompensationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompensationHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'approved_by']