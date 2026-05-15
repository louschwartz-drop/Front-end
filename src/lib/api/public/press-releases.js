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
    }
};
