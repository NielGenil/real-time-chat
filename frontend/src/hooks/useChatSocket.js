// hooks/useChatSocket.js
import { useEffect, useRef, useState } from "react";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

/**
 * useChatSocket — receive-only WebSocket hook.
 *
 * Your REST API (postMessageAPI) still handles sending.
 * This hook simply listens for new messages broadcast by the server.
 *
 * @param {number|null} conversationId  – active conversation id
 * @param {string}      token           – JWT access token
 * @param {Function}    onMessage       – called with a new message object when one arrives
 */
export function useChatSocket(conversationId, token, onMessage) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!conversationId || !token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${conversationId}/?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        onMessage?.(data);   // hand the new message back to ChatPage
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (err) => console.error("[WS] error", err);

    return () => {
      ws.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected };
}