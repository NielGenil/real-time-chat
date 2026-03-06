from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
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
    serializer_class = ConversationSerializer

class MessageListCreate(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]

        return Message.objects.filter(
            conversation_id=conversation_id
        )

    def perform_create(self, serializer):
        conversation_id = self.kwargs["conversation_id"]
        conversation = Conversation.objects.get(id=conversation_id)

        serializer.save(
            sender=self.request.user,
            conversation=conversation
        )

