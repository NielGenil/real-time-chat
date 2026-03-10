from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, NewMessageSerializer, ConversationWithMessageSerializer
from accounts.models import CustomUser
# Create your views here.

class StartConversationView(APIView):

    def post(self, request):
        user_id = request.data.get("user_id")

        sender = request.user
        receiver = CustomUser.objects.get(id=user_id)

        conversation = Conversation.objects.filter(
            participants=sender
        ).filter(
            participants=receiver
        ).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(sender, receiver)

        serializer = ConversationSerializer(conversation, context={"request": request})
        return Response(serializer.data)

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related("messages", "participants")

class ConversationListCreate(generics.ListCreateAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer

class ConversationRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationWithMessageSerializer

class NewMessageListCreate(generics.ListCreateAPIView):
    serializer_class = NewMessageSerializer

    def get_queryset(self):
        user = self.request.user

        return Message.objects.filter(conversation__participants=user)

    def perform_create(self, serializer):
        sender = self.request.user
        receiver_id = self.request.data.get("receiver_id")

        receiver = CustomUser.objects.get(id=receiver_id)

        conversation = Conversation.objects.filter(participants=sender).filter(participants=receiver).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(sender, receiver)

        serializer.save(sender=sender, conversation=conversation)

class MessageListCreate(generics.ListCreateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
