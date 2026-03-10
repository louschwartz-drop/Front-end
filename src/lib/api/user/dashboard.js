import api from "../axios";

export const adminDashboardService = {
  getStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },
};

export const dashboardService = {
  getStats: async (userId) => {
    const response = await api.get(`/user/dashboard/stats?userId=${userId}`);
    return response.data;
  },
};
