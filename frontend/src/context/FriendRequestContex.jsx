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

import { getFriendRequestListAPI } from "../api/userAPI";

const FriendRequestContext = createContext(null);

export function FriendRequestProvider({ children }) {
  const { token } = useHelper();
  const { subscribe, send, wsStatus } = useWebSocket();
  const queryClient = useQueryClient();

  const [friendRequest, setFriendRequest] = useState([]);

  const friendRequestCount = friendRequest.length;

  const { data: friendRequestList } = useQuery({
    queryKey: ["friend-request-list"],
    queryFn: () => getFriendRequestListAPI(token),
    enabled: !!token,
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
  );

  return (
    <FriendRequestContext.Provider
      value={{
        queryClient,
        wsStatus,

        friendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        friendRequestCount,
      }}
    >
      {children}
    </FriendRequestContext.Provider>
  );
}

export function useFriendRequest() {
  return useContext(FriendRequestContext);
}
