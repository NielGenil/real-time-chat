from rest_framework import serializers
from .models import CustomUser, FriendRequest

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        exclude = ['password']
        depth = 1

class CustomUserSerializer(serializers.ModelSerializer):
    friends = FriendSerializer(many= True, read_only=True)
    class Meta:
        model = CustomUser
        exclude = ['password']

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = CustomUserSerializer()
    receiver = CustomUserSerializer()
    class Meta:
        model = FriendRequest
        fields = '__all__'
   