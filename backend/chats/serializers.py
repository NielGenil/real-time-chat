from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "content", "timestamp"]


class ConversationSerializer(serializers.ModelSerializer):

    last_message = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "participants", "last_message", "created_at"]

    def get_last_message(self, obj):
        message = obj.messages.last()
        if message:
            return MessageSerializer(message).data
        return None

    def get_participants(self, obj):
        user = self.context["request"].user
        other_users = obj.participants.exclude(id=user.id)
        return [{"id": u.id, "username": u.username} for u in other_users]
