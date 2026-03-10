import api from "../axios";

export const pricingService = {
    getAll: async () => {
        const response = await api.get("/user/pricing");
        return response.data;
    },
    getPlan: async (id) => {
        const response = await api.get(`/user/pricing/${id}`);
        return response.data;
    }
};
