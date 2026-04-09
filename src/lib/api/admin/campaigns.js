import apiAdmin from "./apiAdmin";

export const adminCampaignService = {
    getCampaigns: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page);
        if (filters.limit) params.append("limit", filters.limit);
        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);

        const response = await apiAdmin.get(`/admin/campaigns?${params.toString()}`);
        return response.data;
    },
    getCampaignById: async (id) => {
        const response = await apiAdmin.get(`/admin/campaigns/${id}`);
        return response.data;
    },
};
