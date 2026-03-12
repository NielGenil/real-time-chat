import { BASE_URL } from "./api";

export const getNotificationAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/notification/list/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const markReadAllNotificationAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/mark-all-read/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to mark notifications as read");
  }

  return true;
};

