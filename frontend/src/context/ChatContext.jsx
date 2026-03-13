// context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHelper } from "../hooks/useHelper";
import { useWebSocket } from "./WebSocketContext";
import { getCurrentUserAPI } from "../api/userAPI";
import { getConversationDataAPI, getConversationListAPI } from "../api/chatAPI";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token } = useHelper();
  const { subscribe, send, wsStatus } = useWebSocket();
  const queryClient = useQueryClient();

  const activeConversationRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [conversationList, setConversationList] = useState([]);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversationListAPI(token),
    enabled: !!token,
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations-data", activeConversation],
    queryFn: () => getConversationDataAPI(token, activeConversation),
    enabled: !!activeConversation && !!token,
  });

  const { data: user } = useQuery({
    queryKey: ["user-data"],
    queryFn: () => getCurrentUserAPI(token),
    enabled: !!token,
  });

  const unreadMesageCount =
    conversations?.filter(
      (conv) =>
        conv?.last_message?.sender?.id != user?.id &&
        conv?.last_message?.is_read === false,
    ).length || 0;

  // Keep ref synced
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    if (conversations) {
      setConversationList(conversations);
    }
  }, [conversations]);

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
        conv?.id === activeConversation ? { ...conv, unread_count: 0 } : conv,
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
            conv?.id === message.conversation
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
    <ChatContext.Provider
      value={{
        send,
        queryClient,
        wsStatus,

        setActiveConversation,
        activeConversation,
        conversationList,
        messages,
        isTyping,
        inputRef,
        sendMessage,
        handleTyping,
        user,
        unreadMesageCount,
        setConversationList,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
