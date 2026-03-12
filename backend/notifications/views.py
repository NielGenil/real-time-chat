from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

# Create your views here.
class NotificationList(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # Exclude the currently authenticated user
        return Notification.objects.filter(recipient=self.request.user).exclude(is_read=True)
    
class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)