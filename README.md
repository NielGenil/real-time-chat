# 💬 Real-Time Chat

A full-stack real-time chat system built with Django Channels, React, Redis, and PostgreSQL.

This module enables users to send instant messages, manage friend connections, create group chats, and receive live notifications — all over a single persistent WebSocket connection.

---

## 🚀 Overview

The Real-Time Chat system is designed to provide seamless communication between users by offering:

* Instant private and group messaging over WebSockets
* Friend request system with live accept / decline responses
* Typing indicators broadcast to conversation participants
* Online / offline presence tracking per connection
* Real-time notification delivery without polling
* Heartbeat mechanism to detect and close dead connections

The system is built on a single shared WebSocket connection per user, routed through Redis Channel Layers for cross-user message delivery.

---

## 🎯 Core Features

### 💬 Messaging
* Private (one-to-one) and group conversations
* Real-time message delivery via WebSocket
* Unread message tracking with mark-as-read support
* Messages ordered chronologically (oldest first)

### 👥 Friend System
* Send, accept, and decline friend requests in real time
* Automatic private conversation creation on friend acceptance
* Re-send support for previously declined requests

### 🔔 Notifications
* Live notification delivery for friend requests, acceptances, declines, and group invitations
* Mark individual notifications as read via WebSocket event
* Notifications ordered by newest first

### ✍️ Presence & Typing
* Online / offline status updated on WebSocket connect and disconnect
* Typing indicator events broadcast to all conversation participants

### 🫂 Group Chat
* Create named group conversations with multiple participants
* All members receive the new group data instantly
* Invited users receive a notification on group creation

---

## 🛠️ Tech Stack

### Backend
* Python
* Django
* Django REST Framework
* Django Channels (WebSocket)
* Daphne (ASGI Server)
* Redis (Channel Layer)
* PostgreSQL

### Frontend
* React
* TanStack Query (React Query)
* Tailwind CSS

---

## 🔄 Real-Time Architecture

The application uses a single WebSocket endpoint per authenticated user. All events — messages, friend requests, notifications — flow through one persistent connection.

Server is run using:

```bash
daphne core.asgi:application
```

or

```bash
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

Architecture Flow:

```
React (Frontend)
↓
WebSocket — ws://<host>/ws/chat/
↓
Django Channels (ChatConsumer)
↓
Redis Channel Layer (user_{id} groups)
↓
PostgreSQL Database
```

Each user is added to a personal channel group (`user_{user.id}`) on connect. The server routes any event — regardless of conversation — to the target user's group, enabling multi-tab and cross-user delivery.

---

## ⚙️ WebSocket Endpoint

```
ws://<host>:8000/ws/chat/
```

Defined in `chat/routing.py`:

```python
websocket_urlpatterns = [
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
]
```

### 🔐 Authentication

The connection requires a valid JWT token. Anonymous connections are rejected immediately inside `connect()`. JWT middleware is applied at the ASGI routing level before the consumer is reached.

---

## 📡 WebSocket Events Reference

All payloads are JSON. The `type` field determines how the server routes each event.

### Messaging

| Event | Direction | Description |
|---|---|---|
| *(no type field)* | Client → Server | Send a message. Requires `conversation_id` and `content`. |
| `chat_message` | Server → Client | Delivers a new message to all conversation participants. |
| `mark_read_message` | Client → Server | Marks all unread messages in a conversation as read. Requires `conversation_id`. |
| `typing` | Client → Server | Notifies other participants the user is typing. Requires `conversation_id`. |
| `user_typing` | Server → Client | Pushed to all other participants when someone is typing. |

### Friend Requests

| Event | Direction | Description |
|---|---|---|
| `send_friend_request` | Client → Server | Send a friend request. Requires `receiver_id`. |
| `friend_request` | Server → Client | Pushed to the receiver with the request and notification data. |
| `accept_friend_request` | Client → Server | Accept a pending request. Requires `friend_request_id` and `receiver_id`. Creates a private conversation if none exists. |
| `decline_friend_request` | Client → Server | Decline a pending request. Requires `friend_request_id` and `receiver_id`. |
| `friend_request_response` | Server → Client | Pushed to both parties on accept or decline. Includes notification and (on accept) the new conversation. |

### Group Chat

| Event | Direction | Description |
|---|---|---|
| `group_chat` | Client → Server | Create a group conversation. Requires `group_name` and `selected_participants` (array of `{id}`). |
| `group_chat_event` | Server → Client | Pushed to all members with the new group data; also pushed with notification to invited users. |

### Notifications

| Event | Direction | Description |
|---|---|---|
| `mark_read_notification` | Client → Server | Marks a single notification as read. Requires `notification_id`. |

---

## 📋 Event Payload Examples

### Send a Message
```json
{
  "conversation_id": 42,
  "content": "Hey, are you free for a call?"
}
```

### Receive a Message
```json
{
  "type": "chat_message",
  "message": {
    "id": 101,
    "conversation": 42,
    "sender": { "id": 5, "username": "john", "first_name": "John" },
    "content": "Hey, are you free for a call?",
    "timestamp": "2024-11-01T10:23:00Z",
    "is_read": false
  }
}
```

### Send a Friend Request
```json
{
  "type": "send_friend_request",
  "receiver_id": 12
}
```

### Accept a Friend Request
```json
{
  "type": "accept_friend_request",
  "friend_request_id": 7,
  "receiver_id": 5
}
```

### Create a Group Chat
```json
{
  "type": "group_chat",
  "group_name": "Sprint Planning",
  "selected_participants": [
    { "id": 3 },
    { "id": 8 }
  ]
}
```

### Mark Messages as Read
```json
{
  "type": "mark_read_message",
  "conversation_id": 42
}
```

---

## 💓 Heartbeat (Ping / Pong)

To detect dead connections caused by NAT timeouts or mobile network switches, the server sends a `ping` every 30 seconds. If no `pong` is received within 10 seconds, the connection is forcibly closed.

```json
// Server → Client
{ "type": "ping" }

// Client → Server
{ "type": "pong" }
```

---

## 🗄️ Data Models

### Conversation

| Field | Type | Description |
|---|---|---|
| `name` | CharField | Display name — used for group chats only |
| `type` | CharField | `"private"` or `"group"` |
| `participants` | M2M → CustomUser | All users in the conversation |
| `created_by` | FK → CustomUser | Creator — populated for group chats |
| `created_at` | DateTimeField | Auto-set on creation |

### Message

| Field | Type | Description |
|---|---|---|
| `conversation` | FK → Conversation | Parent conversation |
| `sender` | FK → CustomUser | User who sent the message |
| `content` | TextField | Message body |
| `timestamp` | DateTimeField | Auto-set; ordered ascending |
| `is_read` | BooleanField | Defaults to `False` |

### FriendRequest

| Field | Type | Description |
|---|---|---|
| `sender` | FK → CustomUser | User who initiated the request |
| `receiver` | FK → CustomUser | User who receives the request |
| `status` | CharField | `"pending"` / `"accepted"` / `"declined"` |
| `created_at` | DateTimeField | Auto-set on creation |

### Notification

| Field | Type | Description |
|---|---|---|
| `sender` | FK → CustomUser | User who triggered the notification |
| `recipient` | FK → CustomUser | Target user |
| `notification_type` | CharField | `friend_request`, `friend_request_accepted`, `friend_request_declined`, `create_group_chat` |
| `text` | TextField | Human-readable message |
| `is_read` | BooleanField | Defaults to `False` |
| `created_at` | DateTimeField | Ordered descending (newest first) |

---

## ⚙️ Redis Configuration

Redis is required as the Channel Layer backend. Configured in `settings.py`:

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    }
}
```

Make sure Redis is running before starting the server:

```bash
redis-server
```

---

## 📦 Installation Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/NielGenil/project-management.git
cd project-management
```

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🧠 Frontend Context Architecture

The frontend manages WebSocket state across the component tree using nested React Contexts:

```
AuthProvider
  └── WebSocketProvider        ← manages the ws:// connection
        └── ChatProvider       ← conversation and message state
              └── NotificationProvider
                    └── FriendRequestProvider
```

* **WebSocketProvider** — establishes and maintains the single WebSocket connection, dispatches events to child contexts
* **ChatProvider** — holds conversation list and message history; handles `chat_message` events
* **NotificationProvider** — manages notification feed; handles friend request notification events
* **FriendRequestProvider** — tracks pending requests; handles `friend_request` and `friend_request_response` events

---

## 🔐 Authentication Flow

* User logs in via REST API
* JWT access and refresh tokens are issued
* Tokens are stored in HTTP-only cookies
* Protected REST endpoints require the `Authorization` header
* WebSocket connections are authenticated via JWT middleware on the ASGI layer

---

## 📈 Future Improvements

* Implement cursor-based message pagination for large conversations
* Support file and image attachments in messages
* Add per-conversation unread message count to conversation list
* Message editing and deletion with real-time broadcast
* Add Docker support for easier Redis and Daphne setup
* Add a message search feature
* Implement conversation mute / archive

---

## 🧠 What I Learned

* Building a single shared WebSocket connection that handles multiple event types
* Using Django Channels with Redis Channel Layers for cross-user message routing
* Bridging async WebSocket consumers with synchronous Django ORM using `@database_sync_to_async`
* Implementing a heartbeat mechanism to handle dead connections
* Managing complex real-time state across nested React Contexts
* Structuring a friend system with live UI updates on both sides
* Provisioning conversations automatically on friend request acceptance

---

## 👨‍💻 Author

John Nathaniel Genil  
GitHub: https://github.com/NielGenil