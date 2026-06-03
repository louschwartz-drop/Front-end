import api from "../axios";

// ── AI Chatbot Assistant API ──
export const getOrCreateAIChat = async (userId, guestId) => {
  const response = await api.post("/user/chat/get-or-create", { userId, guestId });
  return response.data;
};

export const migrateAIChat = async (guestId) => {
  const response = await api.post("/user/chat/ai/migrate", { guestId });
  return response.data;
};

/**
 * Streams AI chat response using native fetch (correct tool for SSE/chunked streaming).
 * Auth token is read from localStorage using the same pattern as the axios interceptor.
 *
 * @param {string} chatId
 * @param {string} message
 * @param {string} [userId]
 * @param {string} [guestId]
 * @returns {Promise<Response>}  — raw fetch Response with a readable body stream
 */
export const streamAIChatResponse = async (chatId, message, userId, guestId) => {
  // Read token the same way the axios interceptor does
  let token = null;
  if (typeof window !== "undefined") {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        token = state?.token ?? null;
      }
    } catch (e) {
      console.error("Error reading auth token for stream:", e);
    }
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/user/chat/ai/stream`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ chatId, message, userId, guestId }),
  });
};

// ── Support Ticket API ──
export const createSupportTicket = async (subject, category, description) => {
  const response = await api.post("/user/chat/ticket/create", { subject, category, description });
  return response.data;
};

export const getSupportTicketsList = async () => {
  const response = await api.get("/user/chat/ticket/list");
  return response.data;
};

export const getSupportTicketMessages = async (ticketId) => {
  const response = await api.get(`/user/chat/ticket/${ticketId}/messages`);
  return response.data;
};

export const reopenSupportTicket = async (ticketId) => {
  const response = await api.post(`/user/chat/ticket/${ticketId}/reopen`);
  return response.data;
};


