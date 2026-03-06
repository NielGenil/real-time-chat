import axios from "axios";
import Cookies from "js-cookie";

export const BASE_URL = `http://${window.location.hostname}:8000`;

let tokenInvalidCallback = null;
export const setTokenInvalidCallback = (callback) => {
  tokenInvalidCallback = callback;
};

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && tokenInvalidCallback) {
      tokenInvalidCallback();
    }
    return Promise.reject(error);
  }
);

export const loginAPI = async (formData) => {
  const credentials = Object.fromEntries(formData.entries());
  const response = await fetch(`${BASE_URL}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw await response.json();
  return response.json();
};