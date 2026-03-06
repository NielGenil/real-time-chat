import { useRef, useState } from "react";
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

export default function FriendRequestPage() {
  const { token } = useHelper();
  const queryClient = useQueryClient();
  const requestRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState(null);

  const [addUserModal, setAddUserModal] = useState(false);
  const [friendRequestId, setFriendRequestId] = useState({});
  const [responded, setResponded] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user-data"],
    queryFn: () => getCurrentUserAPI(token),
  });

  const { data: userList } = useQuery({
    queryKey: ["user-list"],
    queryFn: () => getUserListAPI(token),
  });

  const { data: friendRequestList } = useQuery({
    queryKey: ["friend-request-list"],
    queryFn: () => getFriendRequestListAPI(token),
  });

  const userFriendRequest = Array.isArray(friendRequestList)
    ? friendRequestList
    : [];

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

  console.log(friendRequestId);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="w-[500px] xl:border-r border-gray-300">
        <section className="flex justify-between">
          <h1>Friend Requests</h1>
        </section>
        <form>
          {friendRequestList?.map((friends) => (
            <div className="flex justify-between" key={friends?.id}>
              <div>{friends?.sender?.username}</div>
              {responded === "" ? (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setResponded("declined");
                      postDeclineRequest(friends.id);
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setResponded("accepted");
                      postAcceptRequest(friends.id);
                    }}
                  >
                    Accept
                  </button>
                </div>
              ) : responded === "accepted" ? (
                <div className="flex gap-2">
                  <p>Accpeted</p>
                </div>
              ) : responded === "declined" ? (
                <div className="flex gap-2">
                  <p>Declined</p>
                </div>
              ) : (
                ""
              )}
            </div>
          ))}
        </form>
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
