import api from "../axios";

export const dashboardService = {
    getStats: async (userId) => {
        const response = await api.get(`/user/dashboard/stats/${userId}`);
        return response.data;
    },
};
