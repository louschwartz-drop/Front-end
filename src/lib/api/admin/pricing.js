import apiAdmin from "./apiAdmin";

export const pricingService = {
    getAll: async () => {
        const response = await apiAdmin.get("/admin/pricing");
        return response.data;
    },
    create: async (data) => {
        const response = await apiAdmin.post("/admin/pricing", data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiAdmin.put(`/admin/pricing/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiAdmin.delete(`/admin/pricing/${id}`);
        return response.data;
    }
};
