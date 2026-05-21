import api from "../axios";

export const publicPressReleaseService = {
    /**
     * Get published platform press releases
     */
    getPlatformPressReleases: async (params = {}) => {
        try {
            const response = await api.get("/public/press-releases", { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching platform press releases:", error);
            throw error;
        }
    },

    /**
     * Get a single platform press release by ID
     */
    getPlatformPressReleaseById: async (id) => {
        try {
            const response = await api.get(`/public/press-releases/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching platform press release detail:", error);
            throw error;
        }
    },

    /**
     * Get related platform press releases (excluding current)
     */
    getRelatedPressReleases: async (id, limit = 4) => {
        try {
            const response = await api.get(`/public/press-releases/${id}/related`, { params: { limit } });
            return response.data;
        } catch (error) {
            console.error("Error fetching related press releases:", error);
            throw error;
        }
    }
};
