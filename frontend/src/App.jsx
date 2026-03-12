import { Outlet, useNavigate, Link } from "react-router-dom";
import "./App.css";
import { useHelper } from "./hooks/useHelper";
import { setTokenInvalidCallback } from "./api/api";
import { useEffect, useState } from "react";
import {
  ArrowLeftFromLine,
  Bell,
  Calendar,
  ChartColumnDecreasing,
  CircleUserRound,
  House,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useWebSocket } from "./context/WebSocketContext";
import { useNotification } from "./context/NotificationContext";

function App() {
  const { isAuthenticated, logout, isTokenValid, markTokenInvalid } =
    useHelper();
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false);

  const { unreadCount, friendRequestCount, unreadMesageCount } =
    useNotification();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1281) {
        setSidebar(false);
      } else {
        setSidebar(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTokenInvalidCallback(markTokenInvalid);
  }, []);

  useEffect(() => {
    if (isTokenValid === false) {
      logout();
      navigate("/login");
    }
  }, [isTokenValid, logout, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (isTokenValid === null) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <div className="w-7 h-7 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const logoutSubmit = (e) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  return (
    <main className="w-screen h-screen flex">
      {sidebar && (
        <div
          className="fixed inset-0 bg-black/30 z-10 xl:hidden"
          onClick={() => {
            setSidebar(false);
          }}
        />
      )}
      <aside
        className={`fixed xl:relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden shrink-0 h-full z-20 ${sidebar ? "w-[300px]" : "xl:w-[70px] w-[50px]"}`}
      >
        {/* Header */}
        <div className="flex items-center h-14 px-3 border-b border-gray-100 shrink-0">
          {sidebar ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <CircleUserRound size={28} className="shrink-0 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  Welcome!
                </span>
              </div>
              <button
                onClick={() => setSidebar(false)}
                className="p-3 rounded-md hover:bg-blue-500 text-blue-400 hover:text-white transition-colors"
              >
                <ArrowLeftFromLine className="shrink-0 transition-colors xl:w-5 xl:h-5 w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSidebar(true)}
              className="xl:p-3 p-1 rounded-md hover:bg-blue-500 text-blue-500 hover:text-white transition-colors mx-auto"
            >
              <Menu className="shrink-0 transition-colors xl:w-5 xl:h-5 w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <div
          className={`flex flex-col flex-1 justify-between py-4 overflow-hidden ${sidebar ? "pl-7 pr-7" : ""}`}
        >
          <div className="flex flex-col gap-6 px-2">
            {/* Section 1 */}
            <div className="flex flex-col gap-1">
              <Link
                to={"/"}
                className={`flex items-center gap-6 w-full px-2 h-13 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-gray-600 hover:bg-blue-500 hover:text-white transition-colors group`}
              >
                <div className="relative">
                  <MessagesSquare className="shrink-0 text-blue-500 group-hover:text-white transition-colors xl:w-5 xl:h-5 w-4 h-4" />
                  {!sidebar && unreadMesageCount > 0 && (
                    <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2.5 left-2.5 flex text-[10px] items-center justify-center">
                      {unreadMesageCount}
                    </span>
                  )}
                </div>

                {sidebar && (
                  <div className="relative flex justify-between items-center">
                    <span className="whitespace-nowrap font-medium">Chats</span>

                    {unreadMesageCount > 0 && (
                      <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2 left-9 flex text-[10px] items-center justify-center">
                        {unreadMesageCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
              <Link
                to={"/contacts"}
                className={`flex items-center gap-6 w-full px-2 h-13 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-gray-600 hover:bg-blue-500 hover:text-white transition-colors group`}
              >
                <Users className="shrink-0 text-blue-500 group-hover:text-white transition-colors xl:w-5 xl:h-5 w-4 h-4" />
                {sidebar && (
                  <span className="whitespace-nowrap font-medium">
                    Contacts
                  </span>
                )}
              </Link>
              <Link
                to={"/friend-request"}
                className={`flex items-center gap-6 w-full px-2 h-13 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-gray-600 hover:bg-blue-500 hover:text-white transition-colors group`}
              >
                <div className="relative">
                  <UserRoundPlus className="shrink-0 text-blue-500 group-hover:text-white transition-colors xl:w-5 xl:h-5 w-4 h-4" />

                  {!sidebar && friendRequestCount > 0 && (
                    <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2.5 left-2.5 flex text-[10px] items-center justify-center">
                      {friendRequestCount}
                    </span>
                  )}
                </div>

                {sidebar && (
                  <div className="relative flex justify-between items-center">
                    <span className="whitespace-nowrap font-medium">
                      Friend Request
                    </span>

                    {friendRequestCount > 0 && (
                      <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2 left-24 flex text-[10px] items-center justify-center">
                        {friendRequestCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
              <Link
                to={"/notification"}
                className={`flex items-center gap-6 w-full px-2 h-13 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-gray-600 hover:bg-blue-500 hover:text-white transition-colors group`}
              >
                <div className="relative">
                  <Bell className="shrink-0 text-blue-500 group-hover:text-white transition-colors xl:w-5 xl:h-5 w-4 h-4" />

                  {!sidebar && unreadCount > 0 && (
                    <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2.5 left-2.5 flex text-[10px] items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {sidebar && (
                  <div className="relative flex justify-between items-center">
                    <span className="whitespace-nowrap font-medium">
                      Notifications
                    </span>

                    {unreadCount > 0 && (
                      <span className="absolute bg-red-500 text-white rounded-full w-[15px] h-[15px] bottom-2 left-21 flex text-[10px] items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
              <button
                className={`flex items-center gap-6 w-full px-2 h-13 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-gray-600 hover:bg-blue-500 hover:text-white transition-colors group`}
              >
                <Settings className="shrink-0 text-blue-500 group-hover:text-white transition-colors xl:w-5 xl:h-5 w-4 h-4" />
                {sidebar && (
                  <span className="whitespace-nowrap font-medium">
                    Settings
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="px-2">
            <button
              onClick={logoutSubmit}
              className={`flex items-center gap-6 w-full px-2 h-10 rounded-lg text-sm
  ${sidebar ? "" : "justify-center"}
  text-red-500 hover:bg-red-50 transition-colors group`}
            >
              <LogOut className="shrink-0 xl:w-5 xl:h-5 w-4 h-4" />
              {sidebar && (
                <span className="whitespace-nowrap font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <section
        className={`flex-1 overflow-auto text-sm ${sidebar ? "ml-13 xl:ml-0" : "ml-13 xl:ml-0"}`}
      >
        <Outlet />{" "}
      </section>
    </main>
  );
}

export default App;
