import api from "../axios";

export const adminProfileService = {
    getProfile: async (adminId) => {
        console.log("called")
        const response = await api.get(`/admin/profile/${adminId}`);
        return response.data;
    },
    updateProfile: async (adminId, data) => {
        console.log("called")
        const response = await api.put(`/admin/profile/${adminId}`, data);
        return response.data;
    },
};
