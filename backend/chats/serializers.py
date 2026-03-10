from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import CustomUserConfigureSerializer

class NewMessageSerializer(serializers.ModelSerializer):
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "timestamp", "receiver_id", "conversation"]
        read_only_fields = ["conversation", "sender"]

    def create(self, validated_data):
        validated_data.pop("receiver_id")  # remove it before Message.objects.create
        return Message.objects.create(**validated_data)

class MessageSerializer(serializers.ModelSerializer):
    sender = CustomUserConfigureSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'is_read']

class MessageOnConversationSerializer(serializers.ModelSerializer):
    sender = CustomUserConfigureSerializer()
    class Meta:
        model = Message
        exclude = ["conversation"]
        depth = 1

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
    
class ConversationWithMessageSerializer(serializers.ModelSerializer):
    messages = MessageOnConversationSerializer(many=True, read_only=True)
    participants = CustomUserConfigureSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ["id", "name", "participants", "created_at", "messages"]
        depth = 1
        