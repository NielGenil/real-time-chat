import { useRef, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";

export default function ChatPage() {
  const bottomRef = useRef(null);

  const {
    inputRef,
    queryClient,
    activeConversation,
    setActiveConversation,
    conversations,
    messages,
    isTyping,
    sendMessage,
    handleTyping,
    user,
    wsStatus,
  } = useNotification();

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  console.log(conversations);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto">
      {/* Conversation list */}
      <section className="w-[500px] xl:border-r border-gray-300">
        {conversations?.map((conv) => {
          const otherUser = conv.participants[0];

          return (
            <div
              key={conv.id}
              onClick={() => {
                setActiveConversation(conv.id);
                queryClient.invalidateQueries(["conversations"]);
              }}
              className="p-4 cursor-pointer border-b"
            >
              <div>{otherUser?.username}</div>

              <div
                className={`text-sm flex justify-between ${conv?.last_message?.sender?.id === user?.id ? "text-gray-500" : conv?.last_message?.is_read ? "text-gray-500" : "text-black font-bold"}`}
              >
                <span>
                  {conv?.last_message?.content ||
                    "You are now friends. Start chatting!"}
                </span>
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
