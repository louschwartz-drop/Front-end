import api from "../axios";

export const xprArticleRelease = {
    /**
     * Precheck an article against XPR Media constraints.
     * @param {Object} story The structured story object.
     */
    precheck: async (story, campaignId) => {
        try {
            console.log(story);
            const response = await api.post('/user/xpr-media/precheck', { story, campaignId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Check story status from XPR Media.
     * @param {Object} params Containing guid, domain, and secure.
     */
    checkStatus: async (params) => {
        try {
            const response = await api.get('/user/xpr-media/status', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

};

export default xprArticleRelease;
