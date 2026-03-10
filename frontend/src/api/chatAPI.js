import { BASE_URL } from "./api";

export const postNewMessageAPI = async (token, content, receiverId) => {
  const response = await fetch(`${BASE_URL}/api/new-message/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      content: content,
    }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const postMessageAPI = async (token, formData) => {
  const response = await fetch(`${BASE_URL}/api/message/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData
  });

  if (!response.ok) {
    throw await response.json();
  }

  return await response.json();
};

export const getConversationListAPI = async (token) => {
  const response = await fetch(`${BASE_URL}/api/conversations/`, {
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

export const getConversationDataAPI = async (token, id) => {
  const response = await fetch(`${BASE_URL}/api/edit/conversation/${id}/`, {
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
