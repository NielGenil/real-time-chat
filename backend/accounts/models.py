import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

def user_profile_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"profile_pictures/{filename}"

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True)

    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)

    is_online = models.BooleanField(default=False)

    friends = models.ManyToManyField('self',blank=True)

    profile_picture = models.ImageField(
        upload_to=user_profile_path,
        blank=True,
        null=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
    
class FriendRequest(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
    )

    sender = models.ForeignKey(
        CustomUser,
        related_name="sent_friend_requests",
        on_delete=models.CASCADE
    )

    receiver = models.ForeignKey(
        CustomUser,
        related_name="received_friend_requests",
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sender", "receiver")
