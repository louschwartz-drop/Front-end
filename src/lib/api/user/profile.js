import api from "../axios";

export const profileService = {
    getProfile: async (userId) => {
        const response = await api.get(`/user/profile/${userId}`);
        return response.data;
    },
    updateProfile: async (userId, data) => {
        const response = await api.put(`/user/profile/${userId}`, data);
        return response.data;
    },
};
