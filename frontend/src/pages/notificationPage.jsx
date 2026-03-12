import { useNotification } from "../context/NotificationContext";

export default function NotificationPage() {

  const { notifications, markOneRead, markAllRead } = useNotification();

  return (
    <main className="flex h-full w-full overflow-hidden overflow-y-auto ">
      <section className="w-[500px] xl:border-r border-gray-300">
        <section className="flex justify-between">
          <h1>Notification</h1>
          <button onClick={markAllRead}>Mark all read</button>
        </section>
        {notifications?.map((ntf, index) => (
          <div
            onClick={() => markOneRead(ntf?.id)}
            className="flex justify-between"
            key={ntf?.id ?? `ntf-${index}`}
          >
            <div>{ntf?.text}</div>
            <div>{ntf?.created_at}</div>
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
