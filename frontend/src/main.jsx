import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "./pages/login.jsx";
import ChatPage from "./pages/chatPage.jsx";
import ContactPage from "./pages/contactPage.jsx";
import FriendRequestPage from "./pages/friendRequestPage.jsx";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";
import NotificationPage from "./pages/notificationPAge.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { FriendRequestProvider } from "./context/FriendRequestContex.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <ChatPage />,
      },
      {
        path: "/contacts",
        element: <ContactPage />,
      },
      {
        path: "/friend-request",
        element: <FriendRequestPage />,
      },
      {
        path: "/notification",
        element: <NotificationPage />,
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <ChatProvider>
            <NotificationProvider>
              <FriendRequestProvider>
                <RouterProvider router={router} />
              </FriendRequestProvider>
            </NotificationProvider>
          </ChatProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
