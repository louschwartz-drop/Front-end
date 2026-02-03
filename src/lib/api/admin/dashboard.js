import api from "../axios";

export const adminDashboardService = {
    getStats: async () => {
        const response = await api.get("/admin/dashboard/stats");
        return response.data;
    },
};
