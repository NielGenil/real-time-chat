// context/NotificationContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHelper } from "../hooks/useHelper";
import { useWebSocket } from "./WebSocketContext";
import {
  getNotificationAPI,
  markReadAllNotificationAPI,
} from "../api/notificationAPI";
import { getCurrentUserAPI, getFriendRequestListAPI } from "../api/userAPI";
import { getConversationDataAPI, getConversationListAPI } from "../api/chatAPI";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token } = useHelper();
  const { subscribe, send, wsStatus } = useWebSocket();
  const queryClient = useQueryClient();

  ///////////////////////////////////////////////////OVERALL NOTIFICATION///////////////////////////////////////////////////
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.length;

  // Fetch on app start
  const { data: notificationList } = useQuery({
    queryKey: ["notification-list"],
    queryFn: () => getNotificationAPI(token),
    enabled: !!token,
  });

  useEffect(() => {
    if (notificationList) setNotifications(notificationList);
  }, [notificationList]);

  // Listen for incoming WS notifications
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (
        data.type === "friend_request" ||
        data.type === "friend_request_response"
      ) {
        setNotifications((prev) => [
          data.notification_friend_request || data.notification,
          ...prev,
        ]);
        queryClient.setQueryData(["notification-list"], (old = []) => [
          data.notification_friend_request || data.notification,
          ...old,
        ]);
      }
    });
    return unsubscribe;
  }, [subscribe, queryClient]);

  const markOneRead = useCallback(
    (notificationId) => {
      if (!notificationId) return;
      send({ type: "mark_read_notification", notification_id: notificationId });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    },
    [send],
  );

  const markAllRead = useCallback(async () => {
    await markReadAllNotificationAPI(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    queryClient.invalidateQueries(["notification-list"]);
  }, [token, queryClient]);

  ///////////////////////////////////////////////////FRIEND REQUEST///////////////////////////////////////////////////

  const [friendRequest, setFriendRequest] = useState([]);

  const friendRequestCount = friendRequest.length;

  const { data: friendRequestList } = useQuery({
    queryKey: ["friend-request-list"],
    queryFn: () => getFriendRequestListAPI(token),
  });

  useEffect(() => {
    if (friendRequestList) {
      setFriendRequest(friendRequestList);
    }
  }, [friendRequestList]);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type === "friend_request") {
        const newRequest = data.friend_request;

        setFriendRequest((prev) => [...prev, newRequest]);

        queryClient.setQueryData(["friend-request-list"], (old = []) => [
          data.friend_request,
          ...old,
        ]);

        console.log("New Friend Request", newRequest);
      }

    });

    return unsubscribe;
  }, [subscribe, queryClient, friendRequestList]);

  const acceptFriendRequest = useCallback(
    (friendRequestId, receiver_id) => {
      if (!friendRequestId || !receiver_id) return;
      send({
        type: "accept_friend_request",
        friend_request_id: friendRequestId,
        receiver_id: receiver_id,
      });
    },
    [send],
  );

  const declineFriendRequest = useCallback(
    (friendRequestId, receiver_id) => {
      if (!friendRequestId || !receiver_id) return;
      send({
        type: "decline_friend_request",
        friend_request_id: friendRequestId,
        receiver_id: receiver_id,
      });
    },
    [send],
  )
  ;

  ///////////////////////////////////////////////////CHATS///////////////////////////////////////////////////

  const activeConversationRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversationListAPI(token),
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations-data", activeConversation],
    queryFn: () => getConversationDataAPI(token, activeConversation),
    enabled: !!activeConversation,
  });

  const { data: user } = useQuery({
    queryKey: ["user-data"],
    queryFn: () => getCurrentUserAPI(token),
  });

  const unreadMesageCount =
    conversations?.filter((conv) => conv?.last_message?.is_read === false)
      .length || 0;

  // Keep ref synced
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Load existing messages
  useEffect(() => {
    if (conversationsData?.messages) {
      setMessages(conversationsData.messages);
    }
  }, [conversationsData]);

  // Mark messages as read
  useEffect(() => {
    if (!activeConversation || wsStatus !== "open") return;

    send({
      type: "mark_read_message",
      conversation_id: activeConversation,
    });

    queryClient.setQueryData(["conversations"], (old) => {
      if (!old) return old;

      return old.map((conv) =>
        conv.id === activeConversation ? { ...conv, unread_count: 0 } : conv,
      );
    });
  }, [activeConversation, wsStatus, send, queryClient]);

  // WebSocket message listener
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type === "chat_message") {
        const { message } = data;

        if (message.conversation === activeConversationRef.current) {
          setMessages((prev) => [...prev, message]);
        }

        queryClient.setQueryData(["conversations"], (old) => {
          if (!old) return old;

          return old.map((conv) =>
            conv.id === message.conversation
              ? { ...conv, last_message: message }
              : conv,
          );
        });
      }

      if (data.type === "user_typing") {
        const incomingId = Number(data.conversation_id);
        const currentId = Number(activeConversationRef.current);

        if (incomingId === currentId) {
          setIsTyping(true);

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const sendMessage = (e) => {
    e.preventDefault();

    const content = inputRef.current.value.trim();
    if (!content || wsStatus !== "open") return;

    send({
      type: "chat_message",
      conversation_id: activeConversation,
      content,
    });

    inputRef.current.value = "";
    setIsTyping(false);
  };

  const handleTyping = () => {
    if (wsStatus !== "open") return;

    send({
      type: "typing",
      conversation_id: activeConversation,
      user_id: user?.id,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        queryClient,
        wsStatus,

        notifications,
        unreadCount,
        markOneRead,
        markAllRead,

        friendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        friendRequestCount,

        setActiveConversation,
        activeConversation,
        conversations,
        messages,
        isTyping,
        inputRef,
        sendMessage,
        handleTyping,
        user,
        unreadMesageCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
