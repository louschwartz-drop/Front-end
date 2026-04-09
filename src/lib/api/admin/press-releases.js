import apiAdmin from "./apiAdmin";

export const adminPressReleaseService = {
    getAll: async (params) => {
        const response = await apiAdmin.get("/admin/press-releases", { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await apiAdmin.get(`/admin/press-releases/${id}`);
        return response.data;
    }
};
