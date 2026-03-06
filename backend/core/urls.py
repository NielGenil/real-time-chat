"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from accounts.views import CurrentUserView, UserListView, SendFriendRequest, AcceptFriendRequest, DeclineFriendRequest, FriendRequestList

from chats.views import ConversationListCreate, ConversationRetrieveUpdateDestroy, MessageListCreate, ConversationListView, StartConversationView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Current user data
    path('api/current-user/', CurrentUserView.as_view(), name='current_user'),

    # User list (without current user)
    path('api/user-list/', UserListView.as_view(), name='user_list'),

    # Conversation
    path('api/list-create/conversation/', ConversationListCreate.as_view(), name='list_create_conversation'),
    path('api/edit/conversation/<int:pk>/', ConversationRetrieveUpdateDestroy.as_view(), name='list_create_conversation'),
    path('api/conversations/', ConversationListView.as_view()),
    path('api/start-conversation/', StartConversationView.as_view()),

    # Message
    path('api/message/<int:conversation_id>/', MessageListCreate.as_view(), name='message'),

    # Friend request
    path("api/friends/request/<int:user_id>/", SendFriendRequest.as_view()),
    path("api/friends/accept/<int:request_id>/", AcceptFriendRequest.as_view()),
    path("api/friends/decline/<int:request_id>/", DeclineFriendRequest.as_view()),
    path("api/friends/request/list/", FriendRequestList.as_view()),
]
