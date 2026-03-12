import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { WS_URL } from "../api/api";
import { useHelper } from "../hooks/useHelper";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token } = useHelper();

  const socketRef = useRef(null);
  const listenersRef = useRef([]); // event subscribers
  const [wsStatus, setWsStatus] = useState("connecting");

  useEffect(() => {
    if (!token) return;

    const ws = new ReconnectingWebSocket(
      `${WS_URL}/ws/chat/?token=${token}`,
      [],
      {
        maxRetries: 10,
        minReconnectionDelay: 1000,
        maxReconnectionDelay: 30000,
      },
    );

    ws.onopen = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => setWsStatus("closed");

    // 🔥 central message handler
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      listenersRef.current.forEach((listener) => {
        listener(data);
      });
    };

    socketRef.current = ws;

    return () => ws.close();
  }, [token]);

  // send message
  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  // subscribe to websocket events
  const subscribe = (callback) => {
    listenersRef.current.push(callback);

    return () => {
      listenersRef.current = listenersRef.current.filter(
        (listener) => listener !== callback,
      );
    };
  };

  return (
<WebSocketContext.Provider value={{
      send, subscribe, wsStatus,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
