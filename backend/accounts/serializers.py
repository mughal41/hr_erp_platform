from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'employee_id', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'is_hr_admin', 'is_manager',
            'phone_number', 'language', 'timezone', 'date_format',
            'email_notifications', 'push_notifications', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser', 'is_hr_admin']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'employee_id', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            employee_id=validated_data['employee_id'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        return user
