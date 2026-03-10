import api from "../axios";

export const pressReleaseService = {
    getAll: async (userId, params = {}) => {
        const query = new URLSearchParams({ userId, ...params }).toString();
        const response = await api.get(`/user/press-releases?${query}`);
        return response.data;
    },
    publish: async (campaignId, planId = null, storyPayload = null) => {
        console.log("storyPayload", storyPayload);
        const response = await api.post("/user/press-releases/publish", { campaignId, planId, storyPayload });
        return response.data;
    },
    refreshStatus: async (id, userId) => {
        const response = await api.get(`/user/press-releases/${id}/refresh-status?userId=${userId}`);
        return response.data;
    }
};
