import api from "../axios";

/**
 * Public Blog API services
 */
export const blogService = {
    /**
     * Get all published blogs with pagination and filters
     */
    getPublishedBlogs: async (params) => {
        const response = await api.get("/blogs", { params });
        return response.data;
    },

    /**
     * Get a single blog by its slug
     */
    getBlogBySlug: async (slug) => {
        const response = await api.get(`/blogs/${slug}`);
        return response.data;
    },

    /**
     * Get all blog categories
     */
    getPublicCategories: async () => {
        const response = await api.get("/blogs/categories");
        return response.data;
    }
};
