import { useRef, useState } from "react";
import {
  getCurrentUserAPI,
  getUserListAPI,
  postFriendRequestAPI,
} from "../api/userAPI";
import { useHelper } from "../hooks/useHelper";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getConversationListAPI, postMessageAPI } from "../api/chatAPI";

export default function ContactPage() {
  const { token } = useHelper();
  const friendRequestRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState(null);

  const [addUserModal, setAddUserModal] = useState(false);
  const [userId, setUserId] = useState({});

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

  const { mutate: postFriendRequest } = useMutation({
    mutationFn: ({formData, id}) => postFriendRequestAPI(token, formData, id),
    onSuccess: () => {
      console.log("success");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const submitFriendRequest = (e) => {
    e.preventDefault();

    const formData = new FormData(friendRequestRef.current);

    const id = userId;

    postFriendRequest({formData, id});
  };
  console.log(userFriends);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="w-[500px] xl:border-r border-gray-300">
        <section className="flex justify-between">
          <h1>Contacts</h1>
          <button onClick={() => setAddUserModal(true)}>Add user</button>
        </section>
        <div>
          {userFriends?.map((friends) => (
            <div key={friends?.id}>{friends?.username}</div>
          ))}
        </div>
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

      {addUserModal && (
        <main className="fixed z-50 bg-black/20 inset-0 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded-md shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-bold sm:text-xl text-lg">Add Members</h1>
            </div>

            <div className="w-full flex flex-col gap-5">
              <form
                ref={friendRequestRef}
                onSubmit={submitFriendRequest}
                className="flex flex-col gap-4"
              >
                <p className="sm:text-sm text-xs text-gray-600">
                  Note: Select users and assign roles before adding them to the
                  project.
                </p>

                <input type="hidden" name="sender" value={user.id} />
                <input type="hidden" name="receiver" value={userId} />

                {userList?.filter((u) => !userFriends.some((friend) => friend.id === u.id)) .map((userlist) => (
                  <div key={userlist.id} className="flex justify-between">
                    <p>{userlist?.username}</p>
                    <button
                      type="submit"
                      onClick={() => {
                        setUserId(userlist.id);
                      }}
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
