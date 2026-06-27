import apiAdmin from "./apiAdmin";

/**
 * Admin Case Study API services
 */
export const adminCaseStudyService = {
    /**
     * Get all case studies (for admin management)
     */
    getCaseStudies: async (params) => {
        const response = await apiAdmin.get("/admin/case-studies", { params });
        return response.data;
    },

    /**
     * Get a single case study by ID
     */
    getCaseStudyById: async (id) => {
        const response = await apiAdmin.get(`/admin/case-studies/${id}`);
        return response.data;
    },

    /**
     * Create a new case study
     */
    createCaseStudy: async (data) => {
        const response = await apiAdmin.post("/admin/case-studies", data);
        return response.data;
    },

    /**
     * Update an existing case study
     */
    updateCaseStudy: async (id, data) => {
        const response = await apiAdmin.put(`/admin/case-studies/${id}`, data);
        return response.data;
    },

    /**
     * Delete a case study
     */
    deleteCaseStudy: async (id) => {
        const response = await apiAdmin.delete(`/admin/case-studies/${id}`);
        return response.data;
    },

    /**
     * Upload an image for the case study
     */
    uploadImage: async (formData) => {
        const response = await apiAdmin.post("/admin/case-studies/upload-image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    /**
     * Delete an uploaded image
     */
    deleteImage: async (url) => {
        const response = await apiAdmin.delete("/admin/case-studies/delete-image", {
            data: { url }
        });
        return response.data;
    }
};
