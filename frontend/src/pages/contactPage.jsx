import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentUserAPI,
  getUserListAPI,
  postFriendRequestAPI,
} from "../api/userAPI";
import { useHelper } from "../hooks/useHelper";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getConversationListAPI,
  postMessageAPI,
  postNewMessageAPI,
} from "../api/chatAPI";
import { useWebSocket } from "../context/WebSocketContext";
import { User, UserPlus } from "lucide-react";

export default function ContactPage() {
  const { token } = useHelper();
  const messageRef = useRef(null);
  const friendRequestRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState(false);

  const [search, setSearch] = useState("");

  const [addUserModal, setAddUserModal] = useState(false);
  const [userData, setUserData] = useState(null);

  const { send, wsStatus, subscribe } = useWebSocket();

  const { data: user } = useQuery({
    queryKey: ["user-data"],
    queryFn: () => getCurrentUserAPI(token),
  });

  const { data: userList } = useQuery({
    queryKey: ["user-list"],
    queryFn: () => getUserListAPI(token),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversationListAPI(token),
  });

  const userFriends = Array.isArray(user?.friends) ? user?.friends : [];

  const filteredMember = useMemo(() => {
    const memberListData = Array.isArray(userFriends) ? userFriends : [];
    if (!memberListData) return [];

    return memberListData.filter((user) => {
      const searchableText = [user.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search.toLowerCase());
    });
  }, [userFriends, search]);

  const { mutate: postMessage } = useMutation({
    mutationFn: ({ content, id }) => postNewMessageAPI(token, content, id),
    onSuccess: () => {
      console.log("success");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const { mutate: postFriendRequest } = useMutation({
    mutationFn: ({ formData, id }) => postFriendRequestAPI(token, formData, id),
    onSuccess: () => {
      console.log("success");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type === "friend_request") {
        console.log("Friend request received", data.friend_request);
      }

      if (data.type === "error") {
        alert("Error:", data.message); // "Friend request already exists"
        // show toast/alert
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const submitFriendRequest = (receiverId) => {
    console.log("sending friend request to:", receiverId);
    console.log("ws status:", wsStatus);

    if (wsStatus !== "open") return;

    send({
      type: "send_friend_request",
      receiver_id: receiverId,
    });
  };

  // console.log(userId);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="flex flex-col w-[500px] p-2 xl:p-4 bg-gray-50/50 xl:border-r border-gray-300 gap-4 overflow-y-auto">
        <section className="flex justify-between">
          <h1 className="font-semibold text-md xl:text-lg">Contacts</h1>

          <div className="group relative w-fit">
            <button onClick={() => setAddUserModal(true)}>
              <UserPlus className="text-blue-500 xl:w-5 xl:h-5 w-4 h-4" />
            </button>

            {/* <span className="absolute text-nowrap right-10 bottom-1 mt-2 hidden group-hover:block bg-black text-white text-sm px-2 py-1 rounded">
        Add Friend
      </span> */}

            <div className="absolute top-full right-2/8 -translate-y-2/1 -translate-x-2/6 opacity-0 group-hover:opacity-100 transition">
              {/* Tooltip box */}
              <span className="text-nowrap bg-black text-white text-xs px-3 py-1 rounded shadow-lg">
                Add Friend
              </span>

              {/* Arrow */}
              <div className="w-2 h-2 bg-black rotate-45 mx-auto -mt-3 -mr-1"></div>
            </div>
          </div>
        </section>

        <div className="w-full">
          <input
            type="text"
            placeholder="Search Friends"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
    mb-3 px-3 py-2 text-sm w-full
    border border-gray-300 rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500
  "
          />
        </div>

        <div>
          {filteredMember
            ?.slice()
            .sort((a, b) => a.username.localeCompare(b.username))
            ?.map((friend, index, arr) => {
              const firstLetter = friend.username[0].toUpperCase();

              // Check previous item
              const prevLetter =
                index > 0 ? arr[index - 1].username[0].toUpperCase() : null;

              const showLetter = firstLetter !== prevLetter;

              return (
                <div key={friend.id}>
                  {/* Alphabet Header */}
                  {showLetter && (
                    <div className="font-bold text-gray-500 mt-2">
                      {firstLetter}
                    </div>
                  )}

                  {/* Friend Item */}
                  <div
                    onClick={() => {
                      setUserData(friend);
                      setActiveConversation(true);
                    }}
                    className="cursor-pointer flex gap-2"
                  >
                    <div
                      key={friend.id}
                      className="h-10 w-10 flex gap-2 items-center"
                    >
                      <div>
                        {friend?.profile_picture ? (
                          <div className="relative">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={friend?.profile_picture}
                            />
                            <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-0 top-7"></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <User className="h-10 w-10 bg-gray-200 text-gray-500 rounded-full p-3" />
                            <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-0 top-7"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="w-15 text-nowrap items-center flex font-semibold">
                      {friend.username}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="flex-1 flex w-full h-full items-center justify-center">
        {activeConversation ? (
          <div className="w-full flex flex-col gap-10">
            <div className="w-full flex flex-col gap-2 items-center justify-center">
              {userData?.profile_picture ? (
                <div className="relative">
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={userData?.profile_picture}
                  />
                </div>
              ) : (
                <div className="relative">
                  <User className="h-20 w-20 bg-gray-200 text-gray-500 rounded-full p-3" />
                </div>
              )}
              <span className="font-semibold text-lg">{userData?.username}</span>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center">
              <span className="">{userData?.first_name ? userData?.first_name : "-"}</span>
              <h1 className="text-gray-800 font-semibold">First Name</h1>
              </div>
               <div className="flex flex-col items-center justify-center">
              <span className="">{userData?.last_name ? userData?.last_name : "-"}</span>
              <h1 className="text-gray-800 font-semibold">Last Name</h1>
              </div>
              <div className="flex flex-col items-center justify-center">
              <span className="">{userData?.email ? userData?.email : "-"}</span>
              <h1 className="text-gray-800 font-semibold">Email</h1>
              </div>
            </div>

            
          </div>
        ) : (
          <div>Choose user</div>
        )}
      </section>

      {addUserModal && (
        <main className="fixed z-50 bg-black/20 inset-0 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded-md shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-bold sm:text-xl text-lg">Add Members</h1>
            </div>

            <div className="w-full flex flex-col gap-5">
              <form ref={friendRequestRef} className="flex flex-col gap-4">
                <p className="sm:text-sm text-xs text-gray-600">
                  Note: Send user friend request.
                </p>

                <input type="hidden" name="sender" defaultValue={user.id} />
                {/* <input type="hidden" name="receiver" defaultValue={userId} /> */}

                {userList
                  ?.filter(
                    (u) => !userFriends.some((friend) => friend.id === u.id),
                  )
                  .map((userlist) => (
                    <div key={userlist.id} className="flex justify-between">
                      <p>{userlist?.username}</p>
                      <button
                        type="button"
                        onClick={() => submitFriendRequest(userlist.id)}
                      >
                        Add friend
                      </button>
                    </div>
                  ))}
              </form>

              <div className="flex flex-row-reverse gap-2">
                <button
                  type="button"
                  className="py-2 px-4 border border-gray-300 rounded-md"
                  onClick={() => setAddUserModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </main>
  );
}
