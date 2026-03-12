from django.db import models
from accounts.models import CustomUser

class Notification(models.Model):

    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sender_notifications')
    recipient  = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='recipient_notifications')
    notification_type = models.CharField(max_length=50)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username} - {self.notification_type} - {self.id}"