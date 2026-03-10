import { useEffect, useRef, useState } from "react";
import {
  getCurrentUserAPI,
  getFriendRequestListAPI,
  getUserListAPI,
  postAcceptRequestAPI,
  postDeclineRequestAPI,
  postFriendRequestAPI,
} from "../api/userAPI";
import { useHelper } from "../hooks/useHelper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversationListAPI, postMessageAPI } from "../api/chatAPI";
import { useWebSocket } from "../context/WebSocketContext";

export default function FriendRequestPage() {
  const { token } = useHelper();
  const queryClient = useQueryClient();

  const [responded, setResponded] = useState({});
  const { send, wsStatus, subscribe } = useWebSocket();

  const [friendRequest, setFriendRequest] = useState([]);

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

        console.log("New Friend Request", newRequest);
        queryClient.invalidateQueries(["friend-request-list"]);
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient]);

  const { mutate: postAcceptRequest } = useMutation({
    mutationFn: (id) => postAcceptRequestAPI(token, id),
    onSuccess: () => {
      console.log("success");
      //   queryClient.invalidateQueries(["friend-request-list"]);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const { mutate: postDeclineRequest } = useMutation({
    mutationFn: (id) => postDeclineRequestAPI(token, id),
    onSuccess: () => {
      console.log("success");
      //   queryClient.invalidateQueries(["friend-request-list"]);
    },
    onError: (err) => {
      console.error(err);
    },
  });
  console.log(wsStatus);



  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="w-[500px] xl:border-r border-gray-300">
        <section className="flex justify-between">
          <h1>Friend Requests</h1>
        </section>
        {friendRequest?.map((friends) => (
          <div className="flex justify-between" key={friends?.id}>
            <div>{friends?.sender?.username}</div>

            {responded[friends.id] === undefined ? (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setResponded((prev) => ({
                      ...prev,
                      [friends.id]: "declined",
                    }));
                    if (wsStatus !== "open") return;
                    send({
                      type: "decline_friend_request",
                      friend_request_id: friends?.id,
                    });
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setResponded((prev) => ({
                      ...prev,
                      [friends.id]: "accepted",
                    }));
                    if (wsStatus !== "open") return;
                    send({
                      type: "accept_friend_request",
                      friend_request_id: friends?.id,
                    });
                  }}
                >
                  Accept
                </button>
              </div>
            ) : responded[friends.id] === "accepted" ? (
              <p>Accepted</p>
            ) : (
              <p>Declined</p>
            )}
          </div>
        ))}
      </section>

      <section className="flex-1 w-full h-full">
        {/* {activeConversation ? (
          <form ref={messageRef} onSubmit={submitMessage}>
            <input type="hidden" name="sender" defaultValue={user?.id} />
            <input type="text" name="content" className="border" />
            <button type="submit">Send</button>
          </form>
        ) : (
          <div>Choose user</div>
        )} */}
      </section>
    </main>
  );
}
