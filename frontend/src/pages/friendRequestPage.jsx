import { useState } from "react";
import { useFriendRequest } from "../context/FriendRequestContex";

export default function FriendRequestPage() {
  const [responded, setResponded] = useState({});

  const { friendRequest, acceptFriendRequest, declineFriendRequest } =
    useFriendRequest();

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
                    declineFriendRequest(friends?.id, friends?.sender?.id);
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

                    acceptFriendRequest(friends?.id, friends?.sender?.id);
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
