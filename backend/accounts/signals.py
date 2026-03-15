import os
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import CustomUser


@receiver(pre_save, sender=CustomUser)
def delete_old_profile_picture(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_picture = CustomUser.objects.get(pk=instance.pk).profile_picture
    except CustomUser.DoesNotExist:
        return

    new_picture = instance.profile_picture

    if old_picture and old_picture != new_picture:
        if os.path.isfile(old_picture.path):
            os.remove(old_picture.path)