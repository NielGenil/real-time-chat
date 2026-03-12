from django.db import models
from accounts.models import CustomUser

# Create your models here.
class Conversation(models.Model):
    CONVERSATION_TYPES = (
        ("private", "Private"),
        ("group", "Group"),
    )
    name = models.CharField(max_length=255, blank=True)  # for group chats
    type = models.CharField(max_length=10, choices=CONVERSATION_TYPES, default="private")
    participants = models.ManyToManyField(CustomUser, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]



