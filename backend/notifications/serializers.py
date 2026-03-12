from rest_framework import serializers
from .models import Notification
from accounts.serializers import CustomUserConfigureSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = CustomUserConfigureSerializer()
    recipient = CustomUserConfigureSerializer()
    class Meta:
        model = Notification
        fields = ["id", "sender", "recipient", "notification_type", "text", "is_read", "created_at"]