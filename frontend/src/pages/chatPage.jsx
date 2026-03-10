import { useRef, useState, useEffect } from "react";
import { getCurrentUserAPI } from "../api/userAPI";
import { useHelper } from "../hooks/useHelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversationDataAPI, getConversationListAPI } from "../api/chatAPI";
import { useWebSocket } from "../context/WebSocketContext";

export default function ChatPage() {
  const { token } = useHelper();

  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const activeConversationRef = useRef(null);

  const queryClient = useQueryClient();

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const { send, wsStatus, subscribe } = useWebSocket();

  const { data: user } = useQuery({
    queryKey: ["user-data"],
    queryFn: () => getCurrentUserAPI(token),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversationListAPI(token),
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations-data", activeConversation],
    queryFn: () => getConversationDataAPI(token, activeConversation),
    enabled: !!activeConversation,
  });
  

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
      type: "mark_read",
      conversation_id: activeConversation,
    });

    queryClient.invalidateQueries(["conversations"]);
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

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <main className="flex h-full w-full overflow-hidden overflow-y-auto">
      {/* Conversation list */}
      <section className="w-[500px] xl:border-r border-gray-300">
        {conversations?.map((conv) => {
          const otherUser = conv.participants[0];

          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className="p-4 cursor-pointer border-b"
            >
              <div>{otherUser?.username}</div>

              <div className="text-sm text-gray-500 flex justify-between">
                <span>{conv?.last_message?.content}</span>
                <span>{conv?.last_message?.timestamp}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Chat area */}
      <section className="flex-1 w-full h-full flex flex-col">
        {wsStatus !== "open" && (
          <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1">
            {wsStatus === "connecting"
              ? "Connecting..."
              : "Disconnected — reconnecting..."}
          </div>
        )}

        {activeConversation ? (
          <>
            <div className="flex-1 h-96 content-end overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender?.id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="bg-gray-100 rounded p-2 max-w-xs">
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-400">
                      {msg.sender?.username}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-1 p-2 bg-gray-100 w-16 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex p-4 border-t gap-2">
              <input
                ref={inputRef}
                onChange={handleTyping}
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2"
              />

              <button
                type="submit"
                disabled={wsStatus !== "open"}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Choose a conversation
          </div>
        )}
      </section>
    </main>
  );
}
