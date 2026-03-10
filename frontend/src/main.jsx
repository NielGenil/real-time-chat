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
    ],
  },
  { path: "/login", element: <LoginPage /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
      <RouterProvider router={router} />
      </WebSocketProvider>
    </QueryClientProvider>
  </StrictMode>,
);
