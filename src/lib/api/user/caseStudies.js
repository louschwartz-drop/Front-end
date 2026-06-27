import api from "../axios";

/**
 * Public Case Study API services
 */
export const caseStudyService = {
    /**
     * Get all published case studies with pagination and filters
     */
    getPublishedCaseStudies: async (params) => {
        const response = await api.get("/case-studies", { params });
        return response.data;
    },

    /**
     * Get a single case study by its slug
     */
    getCaseStudyBySlug: async (slug) => {
        const response = await api.get(`/case-studies/${slug}`);
        return response.data;
    },
};
