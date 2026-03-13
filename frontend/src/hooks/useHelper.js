// hooks/useHelper.js
import { useAuth } from "../context/AuthContext";

export function useHelper() {
  const { token, isTokenValid, isAuthenticated, login, logout, markTokenInvalid } = useAuth();

  const hasPermission = (user, perm) => user?.permissions?.includes(perm);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeMilitary = (timeString) => {
    if (!timeString) return "";
    const date = new Date(`1970-01-01T${timeString}`);
    return date
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      .replace(":", "");
  };

  const formattedDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return `${formatDate(dateString)} at ${formatTimeMilitary(
      date.toTimeString().slice(0, 5)
    )}`;
  };

  return {
    token,
    isTokenValid,
    isAuthenticated,
    login,
    logout,
    markTokenInvalid,
    hasPermission,
    formatDate,
    formatTimeMilitary,
    formattedDateTime,
  };
}