import api from "../axios";

export const adminUserService = {
    getAllUsers: async () => {
        const response = await api.get("/admin/users");
        return response.data;
    },
    getUserCampaigns: async (userId) => {
        const response = await api.get(`/admin/users/${userId}/campaigns`);
        return response.data;
    },
};
