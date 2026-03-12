# chat/consumers.py
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message
from .serializers import MessageSerializer
from django.db import IntegrityError
from notifications.models import Notification
from django.db.models import Count
from django.db import transaction


class ChatConsumer(AsyncWebsocketConsumer):
    HEARTBEAT_INTERVAL = 30  # seconds

    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # ✅ User-level group (for receiving messages from any conversation)
        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        await self.set_online_status(True)

        # ✅ Start heartbeat ping loop
        self._heartbeat_task = asyncio.ensure_future(self._heartbeat())

    async def disconnect(self, close_code):
        if hasattr(self, '_heartbeat_task'):
            self._heartbeat_task.cancel()

        if hasattr(self, 'user_group'):
            await self.set_online_status(False)
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

        # ✅ Leave all conversation groups on disconnect
        if hasattr(self, 'conversation_groups'):
            for group in self.conversation_groups:
                await self.channel_layer.group_discard(group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        print("WS RECEIVED:", text_data)
       

        # ✅ Handle pong reply from client — heartbeat acknowledged
        if event_type == 'pong':
            self._pong_received = True
            return

        # ✅ Handle mark-as-read event
        if event_type == 'mark_read_message':
            try:
                conversation_id = int(data.get('conversation_id'))
            except (TypeError, ValueError):
                return
            await self.mark_messages_read(conversation_id)

            
            return

        # Inside chat/consumers.py -> receive method

        if event_type == 'typing':
            conversation_id = data.get('conversation_id')
            # We need to find the participants to know who to alert
            # Let's add a quick helper or reuse logic
            participants = await self.get_participant_ids(conversation_id)
            
            for p_id in participants:
                if p_id != self.user.id:  # Don't send "You are typing" to yourself
                    await self.channel_layer.group_send(
                        f'user_{p_id}',
                        {
                            'type': 'user_typing',
                            'conversation_id': conversation_id,
                            'user_id': self.user.id
                        }
                    )
            return
        
        if event_type == "send_friend_request":
            receiver_id = data.get("receiver_id")
            result = await self.create_friend_request(receiver_id)

            if result:
                await self.channel_layer.group_send(
                    f"user_{result['receiver_id']}",
                    {
                        "type": "friend_request_event",
                        "friend_request": result['friend_request'],
                        "notification_friend_request": result['notification_friend_request'],
                    }
                )
            return
        
        if event_type == 'accept_friend_request':
          
            friend_request_id = int(data.get('friend_request_id'))
            receiver_id = data.get("receiver_id")
           
            result = await self.accepted_friend_request(friend_request_id)

            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "friend_request_response_event",
                    "friend_request_id": friend_request_id,
                    "receiver_id": receiver_id,
                    "notification": result['notification'],
                }
            )
            return
        
        if event_type == 'decline_friend_request':
            try:
                friend_request_id = int(data.get('friend_request_id'))
                receiver_id = data.get("receiver_id")
            except (TypeError, ValueError):
                return
            result = await self.declined_friend_request(friend_request_id)
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "friend_request_response_event",
                    "friend_request_id": friend_request_id,
                    "receiver_id": receiver_id,
                    "notification": result['notification'],
                }
            )

            
            return
        
        if event_type == 'mark_read_notification':
            try:
                notification_id = int(data.get('notification_id'))
            except (TypeError, ValueError):
                return
            await self.mark_notification_read(notification_id)

            
            return


        # Default: send message
        content = data.get('content', '').strip()
        try:
            conversation_id = int(data.get('conversation_id'))
        except (TypeError, ValueError):
            return

        if not content:
            return

        result = await self.save_message_and_get_participants(conversation_id, content)
        if not result:
            return

        message, participant_ids = result

        # ✅ Send to each participant's user group
        for participant_id in participant_ids:
            await self.channel_layer.group_send(
                f'user_{participant_id}',
                {'type': 'chat_message', 'message': message}
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id']
        }))

    async def friend_request_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "friend_request",
            "friend_request": event["friend_request"],
            "notification_friend_request": event["notification_friend_request"],
        }))

    async def friend_request_response_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "friend_request_response",
            "friend_request_id": event["friend_request_id"],
            "receiver_id": event["receiver_id"],
            "notification": event["notification"],
        }))


    # ── Heartbeat ────────────────────────────────────────────────

    async def _heartbeat(self):
        """
        ✅ Every 30s: send ping → wait 10s for pong → close if silent.
        Detects dead connections (NAT timeout, mobile network switch, etc.)
        """
        while True:
            await asyncio.sleep(self.HEARTBEAT_INTERVAL)
            self._pong_received = False
            await self.send(text_data=json.dumps({'type': 'ping'}))

            await asyncio.sleep(10)  # wait 10s for client to reply
            if not self._pong_received:
                await self.close()
                break

    # ── DB helpers ───────────────────────────────────────────────

    @database_sync_to_async
    def set_online_status(self, status: bool):
        self.user.__class__.objects.filter(pk=self.user.pk).update(is_online=status)

    @database_sync_to_async
    def save_message_and_get_participants(self, conversation_id, content):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=self.user
            )
            fresh_user = self.user.__class__.objects.get(pk=self.user.pk)
            if not fresh_user.is_active:
                return None

            message = Message.objects.create(
                conversation=conversation,
                sender=fresh_user,
                content=content,
            )
            participant_ids = list(
                conversation.participants.values_list('id', flat=True)
            )
            return MessageSerializer(message).data, participant_ids

        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_messages_read(self, conversation_id):
        """
        ✅ Mark all unread messages in this conversation as read
        (excluding messages sent by this user)
        """
        Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False,
        ).exclude(sender=self.user).update(is_read=True)

    @database_sync_to_async
    def get_participant_ids(self, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return list(conversation.participants.values_list('id', flat=True))
        except Conversation.DoesNotExist:
            return []
        

    @database_sync_to_async
    def create_friend_request(self, receiver_id):
        from accounts.models import FriendRequest
        from accounts.serializers import FriendRequestSerializer
        from notifications.models import Notification
        from notifications.serializers import NotificationSerializer # Assuming you have one

        try:
            receiver = self.user.__class__.objects.get(id=receiver_id)
            
            friend_request, created = FriendRequest.objects.get_or_create(
                sender=self.user,
                receiver=receiver,
                defaults={"status": "pending"}
            )

            if not created and friend_request.status == "declined":
                friend_request.status = "pending"
                friend_request.save()

            # Create the notification and serialize it
            notification = Notification.objects.create(
                sender=self.user,
                recipient=receiver,
                notification_type="friend_request",
                text=f"{self.user.username} sent you a friend request"
            )

            return {
                "friend_request": FriendRequestSerializer(friend_request).data,
                "notification_friend_request": NotificationSerializer(notification).data,
                "receiver_id": receiver.id
            }

        except Exception as e:
            print("ERROR:", e)
            return None
        
    @database_sync_to_async
    def accepted_friend_request(self, friend_request_id):
        from accounts.models import FriendRequest
        from notifications.models import Notification
        from notifications.serializers import NotificationSerializer

        try:
            friend_request = FriendRequest.objects.get(id=friend_request_id)

            # ✅ Prevent double accept
            if friend_request.status == "accepted":
                return {
                    "notification": None,
                    "receiver_id": friend_request.sender.id
                }

            sender = friend_request.sender
            receiver = friend_request.receiver

            # Update status
            friend_request.status = "accepted"
            friend_request.save()

            # Add each other as friends
            receiver.friends.add(sender)
            sender.friends.add(receiver)

            # Create notification
            notification = Notification.objects.create(
                sender=self.user,
                recipient=sender,
                notification_type="friend_request_accepted",
                text=f"{self.user.username} accepted your friend request"
            )

            # Check if private conversation already exists
            conversation = Conversation.objects.filter(
                type="private",
                participants=sender
            ).filter(
                participants=receiver
            ).first()

            # Create conversation if none exists
            if not conversation:
                conversation = Conversation.objects.create(type="private")
                conversation.participants.add(sender, receiver)

            return {
                "notification": NotificationSerializer(notification).data,
                "receiver_id": sender.id
            }

        except FriendRequest.DoesNotExist:
            return False

    
    @database_sync_to_async
    def declined_friend_request(self, friend_request_id):
        from accounts.models import FriendRequest
        from notifications.serializers import NotificationSerializer # Assuming you have one
        """
        Declined User Friend Request
        """

        try:
            # Get the FriendRequest instance
            friend_request = FriendRequest.objects.get(id=friend_request_id)

            # Update status
            friend_request.status = "declined"
            friend_request.save()


            notification = Notification.objects.create(
                sender=self.user,
                recipient=friend_request.sender,
                notification_type="friend_request_declined",
                text=f"{self.user.username} decline your friend request"
            )


            return {
                "notification": NotificationSerializer(notification).data,
                "receiver_id": friend_request.sender.id
            }
        except FriendRequest.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """
        ✅ Mark all unread messages in this conversation as read
        (excluding messages sent by this user)
        """
        Notification.objects.filter(
            id=notification_id,
            is_read=False,
        ).exclude(sender=self.user).update(is_read=True)

        print("notification mark as read", notification_id)
