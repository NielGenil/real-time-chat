import { useRef, useEffect, useState } from "react";
import { useNotification } from "../context/NotificationContext";
import { useChat } from "../context/ChatContext";
import { useHelper } from "../hooks/useHelper";
import { Plus, Search, User, Users } from "lucide-react";

export default function ChatPage() {
  const { formattedDateTimeTimeOnly } = useHelper();
  const bottomRef = useRef(null);
  const groupNameRef = useRef(null);
  const [addGroupChatModal, setAddGroupChatModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [userData, setUserData] = useState({});

  const {
    inputRef,
    queryClient,
    activeConversation,
    setActiveConversation,
    conversationList,
    messages,
    isTyping,
    sendMessage,
    handleTyping,
    user,
    wsStatus,
    send,
  } = useChat();

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectUser = (friend) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === friend.id);
      if (exists) return prev; // prevent duplicates
      return [...prev, friend];
    });
  };

  const handleRemoveUser = (id) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const availableFriends = user?.friends?.filter(
    (friend) => !selectedUsers.some((u) => u.id === friend.id),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const groupName = groupNameRef.current.value.trim();
    if (wsStatus !== "open") return;
    send({
      type: "group_chat",
      selected_participants: selectedUsers,
      group_name: groupName,
    });
    setAddGroupChatModal(false);
    setSelectedUsers([]);
  };

  const groupName = groupNameRef.current?.value || "";

  const isValidGroup = groupName.trim() !== "" && selectedUsers.length > 1;

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto">
      {/* Conversation list */}
      <section className="flex flex-col w-[500px] p-2 xl:p-4 bg-gray-50/50 xl:border-r border-gray-300 gap-4">
        {/* <img src={user.profile_picture} /> */}
        <div className="flex justify-between">
          <h1 className="font-semibold text-md xl:text-lg">Chats</h1>
          <button onClick={() => setAddGroupChatModal(true)}>
            <Plus className="text-white bg-blue-500 rounded-full w-6 h-6 p-0.5" />
          </button>
        </div>
        <div>
          <div className="relative">
            <input
              type="text"
              className="bg-white shadow-xs  w-full p-2 pl-4 rounded-md h-12"
              placeholder="Search previous conversation"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 text-violet-950">
              <Search className="h-4 w-4 text-gray-500" />
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-md xl:text-lg">Online Friends</h1>
          <div className="flex gap-2 h-20 items-center">
            {user?.friends?.filter((friend) => friend.is_online).length > 0 ? (
              user?.friends
                ?.filter((friend) => friend.is_online)
                .map((friend) => (
                  <div
                    key={friend.id}
                    className="h-15 w-25 flex flex-col items-center justify-center"
                  >
                    <div>
                      {friend?.profile_picture ? (
                        <div className="relative">
                          <img
                            className="h-15 w-15 rounded-full object-cover"
                            src={friend?.profile_picture}
                          />
                          <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-2 top-12"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <User className="h-15 w-15 bg-gray-200 text-gray-500 rounded-full p-3" />
                          <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-2 top-12"></div>
                        </div>
                      )}
                    </div>
                    <span className="w-15 text-nowrap justify-center items-center flex font-semibold">
                      {friend.username}
                    </span>
                  </div>
                ))
            ) : (
              <div className="flex items-center w-full justify-center">
                No friend online
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {conversationList
            ?.slice() // prevents mutating the original array
            .sort((a, b) => {
              const aTime = a?.last_message?.timestamp
                ? new Date(a.last_message.timestamp)
                : new Date(a.created_at);
              const bTime = b?.last_message?.timestamp
                ? new Date(b.last_message.timestamp)
                : new Date(b.created_at);

              return bTime - aTime; // newest first
            })
            .filter((conv) => {
              const otherUser = conv?.participants.find(
                (participant) => participant?.id !== user?.id,
              );

              const name =
                conv?.type === "private" ? otherUser?.username : conv?.name;

              return name?.toLowerCase().includes(search.toLowerCase());
            })
            .map((conv) => {
              const otherUser = conv?.participants.find(
                (participant) => participant?.id !== user?.id,
              );

              console.log(otherUser);

              return (
                <div
                  key={conv?.id}
                  onClick={() => {
                    setActiveConversation(conv?.id);
                    queryClient.invalidateQueries(["conversations"]);
                    setUserData(conv);
                  }}
                  className="p-4 flex gap-2 cursor-pointer bg-white rounded-md shadow-sm"
                >
                  <div className="h-15 w-20">
                    {conv?.type === "private" ? (
                      <>
                        {otherUser?.profile_picture ? (
                          <div className="relative">
                            <img
                              className="h-15 w-15 rounded-full object-cover"
                              src={otherUser?.profile_picture}
                            />
                            <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-3 top-11.5"></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <User className="h-15 w-15 bg-gray-200 text-gray-500 rounded-full p-3" />
                            <div className="bg-green-500 border-3 border-white h-4 w-4 rounded-full absolute right-3 top-11.5"></div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="relative">
                        <Users className="h-15 w-15 bg-gray-200 text-gray-500 rounded-full p-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="justify-center flex flex-col">
                      <div className="font-semibold">
                        {conv?.type === "private" ? (
                          <div>{otherUser?.username}</div>
                        ) : (
                          <div>{conv?.name}</div>
                        )}
                      </div>

                      <div
                        className={`text-sm flex justify-between max-w-70 min-w-0 truncate ${
                          conv?.last_message?.sender?.id === user?.id
                            ? "text-gray-500"
                            : conv?.last_message?.is_read
                              ? "text-gray-500"
                              : "text-black font-bold"
                        }`}
                      >
                        {conv?.type === "private" ? (
                          <span className="truncate">
                            {conv?.last_message?.content ||
                              "You are now friends. Start chatting!"}
                          </span>
                        ) : (
                          <span className="truncate">
                            {conv?.last_message?.content ||
                              "Say hi to your friends. Start chatting!"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse">
                      <span>
                        {formattedDateTimeTimeOnly(
                          conv?.last_message?.timestamp,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Chat area */}
      <section className="flex-1 w-full h-full flex flex-col">
        {wsStatus !== "open" && (
          <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1">
            {wsStatus === "connecting"
              ? "Connecting..."
              : "Disconnected — reconnecting..."}
          </div>
        )}

        {activeConversation ? (
          <>
            <div className="border-b border-gray-300 shadow-sm w-full p-2 pl-4">
              {userData.type === "private" ? (
                <>
                  {userData?.participants.map((userdata) => (
                    <div className="flex gap-2 items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={userdata?.profile_picture}
                      />
                      <span>{userdata.username}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex gap-2 items-center">
                  <User className="h-10 w-10 bg-gray-200 text-gray-500 rounded-full p-3" />
                  <span>{userData?.name}</span>
                </div>
              )}
            </div>
            <div className="flex-1 h-96 content-end overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender?.id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="bg-gray-100 rounded p-2 max-w-xs wrap-break-word">
                    <p className="">{msg.content}</p>
                    <p className="text-xs text-gray-400">
                      {msg.sender?.username}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-1 p-2 bg-gray-100 w-16 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex p-4 border-t gap-2">
              <input
                ref={inputRef}
                onChange={handleTyping}
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2"
              />

              <button
                type="submit"
                disabled={wsStatus !== "open"}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Choose a conversation
          </div>
        )}
      </section>

      {addGroupChatModal && (
        <main className="fixed z-50 bg-black/20 inset-0 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded-md shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-bold sm:text-xl text-lg">
                Create Group Chat
              </h1>
            </div>

            <div className="w-full flex flex-col gap-5">
              <form className="flex flex-col gap-4">
                <p className="sm:text-sm text-xs text-gray-600">
                  Note: Select users and create group.
                </p>

                <div>
                  <h1>Group Chat name</h1>
                  <input
                    ref={groupNameRef}
                    type="text"
                    name="name"
                    required
                    className="border p-2 w-full rounded"
                  />
                </div>

                <input type="hidden" name="created_by" value={user.id} />
                <input type="hidden" name="type" value="group" />

                {/* Selected Members */}
                {selectedUsers.length > 0 && (
                  <div className="border p-2 rounded-md">
                    <p className="text-sm font-semibold mb-2">
                      Selected Members ({selectedUsers.length + 1})
                    </p>

                    <div className="flex justify-between">
                      <span>{user.username} (Creator)</span>
                    </div>

                    {selectedUsers.map((u) => (
                      <div key={u.id} className="flex justify-between">
                        <span>{u.username}</span>

                        <button
                          type="button"
                          onClick={() => handleRemoveUser(u.id)}
                          className="text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friend List */}
                {availableFriends?.map((friend) => (
                  <div key={friend.id} className="flex justify-between">
                    <p>{friend.username}</p>

                    <button
                      type="button"
                      onClick={() => handleSelectUser(friend)}
                    >
                      Select
                    </button>
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!isValidGroup}
                  className={`py-2 px-4 rounded-md text-white ${
                    isValidGroup
                      ? "bg-blue-500"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Create Group
                </button>
              </form>

              <div className="flex flex-row-reverse gap-2">
                <button
                  type="button"
                  className="py-2 px-4 border border-gray-300 rounded-md"
                  onClick={() => setAddGroupChatModal(false)}
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
