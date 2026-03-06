from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import CustomUserSerializer, FriendRequestSerializer
from .models import CustomUser, FriendRequest
# Create your views here.

class UserListView(generics.ListAPIView):
    serializer_class = CustomUserSerializer

    def get_queryset(self):
        # Exclude the currently authenticated user
        return CustomUser.objects.exclude(id=self.request.user.id)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user
    
class SendFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):

        receiver = CustomUser.objects.get(id=user_id)

        friend_request, created = FriendRequest.objects.get_or_create(
            sender=request.user,
            receiver=receiver
        )

        if not created:
            return Response({"message": "Friend request already sent"})

        return Response({"message": "Friend request sent"})
    
class AcceptFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):

        friend_request = FriendRequest.objects.get(
            id=request_id,
            receiver=request.user
        )

        friend_request.status = "accepted"
        friend_request.save()

        sender = friend_request.sender
        receiver = friend_request.receiver

        sender.friends.add(receiver)

        return Response({"message": "Friend request accepted"})

class DeclineFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):

        friend_request = FriendRequest.objects.get(
            id=request_id,
            receiver=request.user
        )

        friend_request.status = "declined"
        friend_request.save()

        return Response({"message": "Friend request declined"})

class FriendRequestList(generics.ListAPIView):
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        return FriendRequest.objects.filter(receiver=self.request.user.id, status="pending")
    

