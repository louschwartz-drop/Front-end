import apiAdmin from "./apiAdmin";

export const adminDashboardService = {
    getStats: async () => {
        const response = await apiAdmin.get("/admin/dashboard/stats");
        return response.data;
    },
};
