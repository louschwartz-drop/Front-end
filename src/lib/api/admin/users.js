import apiAdmin from "./apiAdmin";

export const adminUserService = {
    getAllUsers: async (params) => {
        const response = await apiAdmin.get("/admin/users", { params });
        return response.data;
    },
    getUserCampaigns: async (userId, params = {}) => {
        const response = await apiAdmin.get(`/admin/users/${userId}/campaigns`, { params });
        return response.data;
    },
    getUserPayments: async (userId) => {
        const response = await apiAdmin.get(`/admin/users/${userId}/payments`);
        return response.data;
    },
};
