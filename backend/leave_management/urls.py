from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet,
    LeaveCalendarViewSet, CompOffRequestViewSet
)

router = DefaultRouter()
router.register(r'types', LeaveTypeViewSet, basename='leavetype')
router.register(r'balances', LeaveBalanceViewSet, basename='leavebalance')
router.register(r'requests', LeaveRequestViewSet, basename='leaverequest')
router.register(r'calendar', LeaveCalendarViewSet, basename='leavecalendar')
router.register(r'compoff', CompOffRequestViewSet, basename='compoff')

urlpatterns = [
    path('', include(router.urls)),
]
