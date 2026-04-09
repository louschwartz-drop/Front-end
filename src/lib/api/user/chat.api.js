import api from "../axios";

export const getOrCreateChat = async (userId, guestId) => {
  const response = await api.post("/user/chat/get-or-create", { userId, guestId });
  return response.data;
};

export const getChatMessages = async (chatId) => {
  const response = await api.get(`/user/chat/${chatId}/messages`);
  return response.data;
};

export const getChatHistory = async () => {
  const response = await api.get("/user/chat/history");
  return response.data;
};
