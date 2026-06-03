import apiAdmin from "./apiAdmin";

export const getAllSupportTicketsAdmin = async () => {
  const response = await apiAdmin.get("/admin/chat");
  return response.data;
};

export const getSupportTicketMessagesAdmin = async (ticketId) => {
  const response = await apiAdmin.get(`/admin/chat/${ticketId}/messages`);
  return response.data;
};

export const deleteSupportTicketAdmin = async (ticketId) => {
  const response = await apiAdmin.delete(`/admin/chat/${ticketId}`);
  return response.data;
};

