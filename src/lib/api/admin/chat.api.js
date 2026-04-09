import apiAdmin from "./apiAdmin";

export const getAllChatsAdmin = async () => {
  const response = await apiAdmin.get("/admin/chat");
  return response.data;
};

export const getChatMessagesAdmin = async (chatId) => {
  const response = await apiAdmin.get(`/admin/chat/${chatId}/messages`);
  return response.data;
};

export const deleteChatAdmin = async (chatId) => {
  const response = await apiAdmin.delete(`/admin/chat/${chatId}`);
  return response.data;
};
