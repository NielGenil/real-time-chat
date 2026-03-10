# chat/routing.py
from django.urls import re_path
from . import consumers

# routing.py
websocket_urlpatterns = [
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),  # no conversation_id in URL
]