// context/NotificationContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHelper } from "../hooks/useHelper";
import { useWebSocket } from "./WebSocketContext";
import {
  getNotificationAPI,
  markReadAllNotificationAPI,
} from "../api/notificationAPI";
import { useChat } from "./ChatContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token } = useHelper();
  const { subscribe, send, wsStatus } = useWebSocket();
  const queryClient = useQueryClient();
  const { setConversationList } = useChat();

  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications?.filter(Boolean).length;

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

      // ✅ invalidate conversations when friend request accepted
      if (data.type === "friend_request_response") {
        const newConv = data.conversation;

        // Update conversation list cache
        if (newConv) {
          queryClient.setQueryData(["conversations"], (old = []) => {
            const exists = old.find((c) => c?.id === newConv?.id);
            if (exists) return old;
            return [newConv, ...old];
          });

          setConversationList((prev) => {
            const exists = prev.find((c) => c?.id === newConv?.id);
            if (exists) return prev;
            return [newConv, ...prev];
          });
        }
      }

      if (data.type === "group_chat_event") {
        const newConv = data.group;

        if (newConv) {
          queryClient.setQueryData(["conversations"], (old = []) => {
            const exists = old.find((c) => c?.id === newConv?.id);
            if (exists) return old;
            return [newConv, ...old];
          });

          setConversationList((prev) => {
            const exists = prev.find((c) => c?.id === newConv?.id);
            if (exists) return prev;
            return [newConv, ...prev];
          });
        }

        if (data.notification) {
          queryClient.setQueryData(["notification-list"], (old = []) => [
            data.notification,
            ...old,
          ]);
        }
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
          n?.id === notificationId ? { ...n, is_read: true } : n,
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

  return (
    <NotificationContext.Provider
      value={{
        queryClient,
        wsStatus,

        notifications,
        unreadCount,
        markOneRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
