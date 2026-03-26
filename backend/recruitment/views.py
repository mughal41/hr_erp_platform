from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    JobRequisition, Candidate, Application,
    Interview, InterviewFeedback, OfferLetter
)
from .serializers import (
    JobRequisitionSerializer, CandidateSerializer, ApplicationSerializer,
    InterviewSerializer, InterviewFeedbackSerializer, OfferLetterSerializer
)

class JobRequisitionViewSet(viewsets.ModelViewSet):
    queryset = JobRequisition.objects.all()
    serializer_class = JobRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'approved'
        req.approved_at = timezone.now()
        if hasattr(request.user, 'employee_profile'):
            req.approved_by = request.user.employee_profile
        req.save()
        return Response(JobRequisitionSerializer(req).data)

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated]

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

class InterviewFeedbackViewSet(viewsets.ModelViewSet):
    queryset = InterviewFeedback.objects.all()
    serializer_class = InterviewFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

class OfferLetterViewSet(viewsets.ModelViewSet):
    queryset = OfferLetter.objects.all()
    serializer_class = OfferLetterSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        offer = self.get_object()
        offer.status = 'approved'
        if hasattr(request.user, 'employee_profile'):
            offer.approved_by = request.user.employee_profile
        offer.save()
        return Response(OfferLetterSerializer(offer).data)
