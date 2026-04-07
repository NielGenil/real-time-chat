import { Check, User } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import { useHelper } from "../hooks/useHelper";


export default function NotificationPage() {
  const { formattedDateTime } = useHelper();

  const { notifications, markOneRead, markAllRead } = useNotification();

  console.log(notifications);

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="flex flex-col w-[500px] p-2 xl:p-4 bg-gray-50/50 xl:border-r border-gray-300 gap-4 overflow-y-auto">
        <section className="flex justify-between">
          <h1 className="font-semibold text-md xl:text-lg">Notification</h1>
          <button className="flex gap-1 items-center" onClick={markAllRead}><Check className=" xl:w-5 xl:h-5 w-4 h-4"/> Mark all read</button>
        </section>
        <div className="flex flex-col gap-1">
          {notifications
            ?.slice() // prevents mutating the original array
            .sort((a, b) => new Date(b?.created_at) - new Date(a?.created_at))
            .map((ntf, index) => (
              <div
                onClick={() => {
                  markOneRead(ntf?.id);
                }}
                className={`flex justify-between p-4 py-6 shadow-sm rounded-md ${ntf?.is_read ? "bg-gray-50 hover:bg-gray-50" : "bg-white"}`}
                key={ntf?.id ?? `ntf-${index}`}
              >
                <div className="flex gap-2 items-center">
                  <div className="">
                    {ntf?.sender?.profile_picture ? (
                      <div className="relative">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={ntf?.sender?.profile_picture}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <User className="h-10 w-10 bg-gray-200 text-gray-500 rounded-full p-3" />
                      </div>
                    )}
                  </div>

                  <div>{ntf?.text}</div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  {ntf?.is_read ? <span className="h-3 w-3 rounded-full"/> : <span className="bg-blue-500 h-3 w-3 rounded-full"/>}
                  
                  <span className="text-gray-700 text-xs">
                    {formattedDateTime(ntf?.created_at)}
                  </span>
                </div>
              </div>
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
    </main>
  );
}
