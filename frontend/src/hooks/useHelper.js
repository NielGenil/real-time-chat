import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BASE_URL } from "../api/api";

export function useHelper() {
  const [token, setToken] = useState(Cookies.get("access"));
  const [isTokenValid, setIsTokenValid] = useState(true);
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!token) {
      setIsTokenValid(false);
      return;
    }

    const refreshAccessToken = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      const refreshToken = Cookies.get("refresh");
      if (!refreshToken) {
        setIsTokenValid(false);
        isRefreshingRef.current = false;
        return false;
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        Cookies.set("access", newAccessToken);
        setToken(newAccessToken);
        setIsTokenValid(true);
        return true;
      } catch (error) {
        Cookies.remove("access");
        Cookies.remove("refresh");
        setToken(null);
        setIsTokenValid(false);
        return false;
      } finally {
        isRefreshingRef.current = false;
      }
    };

    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      if (timeUntilExpiry <= 0) {
        Cookies.remove("access");
        Cookies.remove("refresh");
        setToken(null);
        setIsTokenValid(false);
        return;
      }

      const refreshTime = timeUntilExpiry - 60000;

      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(refreshAccessToken, refreshTime);
      } else {
        refreshAccessToken();
      }
    } catch {
      Cookies.remove("access");
      Cookies.remove("refresh");
      setToken(null);
      setIsTokenValid(false);
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [token]);

  const isAuthenticated = !!token;

  const logout = () => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    Cookies.remove("access");
    Cookies.remove("refresh");
    setToken(null);
    setIsTokenValid(false);
  };

  const markTokenInvalid = () => setIsTokenValid(false);

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
    isAuthenticated,
    logout,
    isTokenValid,
    token,
    hasPermission,
    markTokenInvalid,
    formatDate,
    formatTimeMilitary,
    formattedDateTime,
  };
}