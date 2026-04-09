import apiAdmin from "./apiAdmin";

export const adminProfileService = {
    getProfile: async (adminId) => {
        const response = await apiAdmin.get(`/admin/profile/${adminId}`);
        return response.data;
    },
    updateProfile: async (adminId, data) => {
        const response = await apiAdmin.put(`/admin/profile/${adminId}`, data);
        return response.data;
    },
};
