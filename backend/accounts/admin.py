from django.contrib import admin
from .models import CustomUser, FriendRequest
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    model = CustomUser

    fieldsets = UserAdmin.fieldsets + (
        ("Social", {"fields": ("friends",)}),
    )

    filter_horizontal = ("groups", "user_permissions", "friends")
    
    list_display = ('first_name', 'last_name', 'email')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(FriendRequest)
