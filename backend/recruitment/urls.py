from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobRequisitionViewSet, CandidateViewSet, ApplicationViewSet,
    InterviewViewSet, InterviewFeedbackViewSet, OfferLetterViewSet
)

router = DefaultRouter()
router.register(r'requisitions', JobRequisitionViewSet, basename='jobrequisition')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'feedback', InterviewFeedbackViewSet, basename='interviewfeedback')
router.register(r'offers', OfferLetterViewSet, basename='offerletter')

urlpatterns = [
    path('', include(router.urls)),
]
