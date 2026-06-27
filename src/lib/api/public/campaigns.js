import api from "../axios";

// Public API endpoints do not require the user to be logged in
// We assume there's an api instance configured. We can just use the standard `api` which might include tokens if logged in, but backend allows it either way, or we can use raw axios.
// Assuming `api` from "../axios" handles requests gracefully.

export const publicCampaignService = {
    getSharedCampaign: async (campaignId, token) => {
        // Backend route is /api/v1/public/campaigns/:id
        const response = await api.get(`/public/campaigns/${campaignId}?token=${token}`);
        return response.data;
    }
};
