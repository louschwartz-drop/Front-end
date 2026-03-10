import api from "../axios";

export const adminPressReleaseService = {
    getAll: async (params) => {
        const response = await api.get("/admin/press-releases", { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/admin/press-releases/${id}`);
        return response.data;
    }
};
