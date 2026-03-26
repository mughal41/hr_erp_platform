from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/company/', include('company.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/leave/', include('leave_management.urls')),
    path('api/v1/payroll/', include('payroll.urls')),
    path('api/v1/recruitment/', include('recruitment.urls')),
    path('api/v1/hr/', include('employees.urls')),
]
