import { BASE_URL } from "./api";

export const postMessageAPI = async (token, formData, id) => {
  const response = await fetch(`${BASE_URL}/api/message/${id}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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
