// context/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BASE_URL, setTokenInvalidCallback } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(Cookies.get("access"));
  const [isTokenValid, setIsTokenValid] = useState(null);
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    Cookies.remove("access");
    Cookies.remove("refresh");
    setToken(null);
    setIsTokenValid(false);
  }, []);

  const login = useCallback((accessToken, refreshToken) => {
    Cookies.set("access", accessToken);
    Cookies.set("refresh", refreshToken);
    setToken(accessToken);
    setIsTokenValid(true);
  }, []);

  const markTokenInvalid = useCallback(() => setIsTokenValid(false), []);

  useEffect(() => {
    setTokenInvalidCallback(markTokenInvalid);
  }, []);

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
        return;
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        Cookies.set("access", newAccessToken);
        setToken(newAccessToken);
        setIsTokenValid(true);
      } catch {
        logout();
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
        logout();
        return;
      }

      setIsTokenValid(true);

      const refreshTime = timeUntilExpiry - 60000;

      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(refreshAccessToken, refreshTime);
      } else {
        refreshAccessToken();
      }
    } catch {
      logout();
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        isTokenValid,
        isAuthenticated: !!token,
        login,
        logout,
        markTokenInvalid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}