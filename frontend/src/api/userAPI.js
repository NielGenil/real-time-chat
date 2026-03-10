import { BASE_URL } from "./api";

export const getCurrentUserAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/current-user/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const getUserListAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/user-list/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const postFriendRequestAPI = async (token, formData, id) => {
  const response = await fetch(`${BASE_URL}/api/friends/request/${id}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) {
    console.log(response);
    throw await response.json();
  }

  return await response.json();
};

export const getFriendRequestListAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/friends/request/list/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const postAcceptRequestAPI = async (token, id) => {
  const response = await fetch(`${BASE_URL}/api/friends/accept/${id}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const postDeclineRequestAPI = async (token, id) => {
  const response = await fetch(`${BASE_URL}/api/friends/decline/${id}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};
