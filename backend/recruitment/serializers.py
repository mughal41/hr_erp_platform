from rest_framework import serializers
from .models import (
    JobRequisition, Candidate, Application,
    Interview, InterviewFeedback, OfferLetter
)

class JobRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequisition
        fields = '__all__'
        read_only_fields = ['id', 'status', 'requested_at', 'approved_at', 'posted_at', 'approved_by']

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['id', 'applied_at', 'current_stage', 'status', 'rejected_at', 'rejected_by', 'converted_at']

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

class InterviewFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewFeedback
        fields = '__all__'
        read_only_fields = ['submitted_at']

class OfferLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferLetter
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'approved_by', 'sent_at', 'accepted_at', 'rejected_at']
