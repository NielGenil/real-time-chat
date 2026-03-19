from django.contrib import admin
from .models import CustomUser, FriendRequest
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    model = CustomUser

    fieldsets = UserAdmin.fieldsets + (
        ("Social", {"fields": ("friends",)}),
        ("Profile", {"fields": ("profile_picture",)}),
        ("Status", {"fields": ("is_online",)}),
    )

    filter_horizontal = ("groups", "user_permissions", "friends")
    
    list_display = ('first_name', 'last_name', 'email', 'is_online')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(FriendRequest)
