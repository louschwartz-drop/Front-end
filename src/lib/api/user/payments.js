import api from "../axios";

export const paymentService = {
    getCards: async (userId) => {
        const response = await api.get(`/user/payments/cards?userId=${userId}`);
        return response.data;
    },
    deleteCard: async (cardId) => {
        const response = await api.delete(`/user/payments/cards/${cardId}`);
        return response.data;
    },
    createPaymentIntent: async (campaignId, planId, userId, saveCard) => {
        const response = await api.post("/user/payments/create-payment-intent", { campaignId, planId, userId, saveCard });
        return response.data;
    },
    getHistory: async (params) => {
        const response = await api.get("/user/payments/history", { params });
        return response.data;
    },
    setDefaultCard: async (cardId, userId) => {
        const response = await api.post("/user/payments/cards/default", { cardId, userId });
        return response.data;
    }
};
