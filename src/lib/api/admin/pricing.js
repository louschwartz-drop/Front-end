import api from "../axios";

export const pricingService = {
    getAll: async () => {
        const response = await api.get("/admin/pricing");
        return response.data;
    },
    create: async (data) => {
        const response = await api.post("/admin/pricing", data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/admin/pricing/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/admin/pricing/${id}`);
        return response.data;
    }
};
