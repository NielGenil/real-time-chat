import { useState } from "react";
import { useFriendRequest } from "../context/FriendRequestContex";
import { User } from "lucide-react";

export default function FriendRequestPage() {
  const [responded, setResponded] = useState({});

  const { friendRequest, acceptFriendRequest, declineFriendRequest } =
    useFriendRequest();

  console.log(friendRequest);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="flex flex-col w-[500px] p-2 xl:p-4 bg-gray-50/50 xl:border-r border-gray-300 gap-4 overflow-y-auto">
        <section className="flex justify-between">
          <h1 className="font-semibold text-md xl:text-lg">Friend Requests</h1>
        </section>
        {friendRequest?.map((friends) => (
          <div className="flex justify-between" key={friends?.id}>
            <div className="flex gap-2 items-center">
              {friends?.sender?.profile_picture ? (
                <div className="relative">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={friends?.sender?.profile_picture}
                  />
                </div>
              ) : (
                <div className="relative">
                  <User className="h-10 w-10 bg-gray-200 text-gray-500 rounded-full p-3" />
                </div>
              )}

              <p className="font-semibold">{friends?.sender?.username}</p>
            </div>

            {responded[friends.id] === undefined ? (
              <div className="flex gap-2">
                <button
                  className="bg-gray-300 p-2 rounded-md font-semibold px-4"
                  onClick={(e) => {
                    e.preventDefault();
                    setResponded((prev) => ({
                      ...prev,
                      [friends.id]: "declined",
                    }));
                    declineFriendRequest(friends?.id, friends?.sender?.id);
                  }}
                >
                  Decline
                </button>
                <button
                  className="bg-blue-500 text-white p-2 rounded-md font-semibold px-4"
                  onClick={(e) => {
                    e.preventDefault();
                    setResponded((prev) => ({
                      ...prev,
                      [friends.id]: "accepted",
                    }));

                    acceptFriendRequest(friends?.id, friends?.sender?.id);
                  }}
                >
                  Accept
                </button>
              </div>
            ) : responded[friends.id] === "accepted" ? (
              <p className="bg-gray-200 px-4 font-semibold p-2 rounded-md text-gray-600">
                Accepted
              </p>
            ) : (
              <p className="bg-gray-200 px-4 font-semibold p-2 rounded-md text-gray-600">
                Declined
              </p>
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
