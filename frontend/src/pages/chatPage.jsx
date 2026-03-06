import { useRef, useState } from "react";
import { getCurrentUserAPI, getUserListAPI } from "../api/userAPI";
import { useHelper } from "../hooks/useHelper";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getConversationListAPI, postMessageAPI } from "../api/chatAPI";

export default function ChatPage() {
  const { token } = useHelper();
  const messageRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState(null);

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

  const { mutate: postMessage } = useMutation({
    mutationFn: ({ formData, conversationId }) =>
      postMessageAPI(token, formData, conversationId),
    onSuccess: () => {
      console.log("success");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const submitMessage = (e) => {
    e.preventDefault();

    const formData = new FormData(messageRef.current);

    postMessage({
      formData,
      conversationId: activeConversation,
    });
  };

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="w-[500px] xl:border-r border-gray-300">
        {conversations?.map((conv) => {
          const otherUser = conv.participants[0];

          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className="p-4 cursor-pointer border-b"
            >
              <div>{otherUser?.username}</div>

              <div className="text-sm text-gray-500 flex justify-between">
                <span>
                {conv?.last_message?.content}</span>
                <span>
                {conv?.last_message?.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex-1 w-full h-full">
        {activeConversation ? (
          <form ref={messageRef} onSubmit={submitMessage}>
            <input type="hidden" name="sender" defaultValue={user?.id} />
            <input type="text" name="content" className="border" />
            <button type="submit">Send</button>
          </form>
        ) : (
          <div>Choose user</div>
        )}
      </section>
    </main>
  );
}
