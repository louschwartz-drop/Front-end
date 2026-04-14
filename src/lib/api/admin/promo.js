import apiAdmin from "./apiAdmin";

export const promoService = {
    getAll: async () => {
        const response = await apiAdmin.get("/admin/promo");
        return response.data;
    },
    create: async (data) => {
        const response = await apiAdmin.post("/admin/promo", data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiAdmin.put(`/admin/promo/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiAdmin.delete(`/admin/promo/${id}`);
        return response.data;
    },
    toggleStatus: async (id) => {
        const response = await apiAdmin.patch(`/admin/promo/${id}/toggle`);
        return response.data;
    }
};
