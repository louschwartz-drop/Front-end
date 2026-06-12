import apiAdmin from "./apiAdmin";

/**
 * Admin Blog API services
 */
export const adminBlogService = {
    /**
     * Get all blogs (for admin management)
     */
    getBlogs: async (params) => {
        const response = await apiAdmin.get("/admin/blogs", { params });
        return response.data;
    },

    /**
     * Get a single blog by ID
     */
    getBlogById: async (id) => {
        const response = await apiAdmin.get(`/admin/blogs/${id}`);
        return response.data;
    },

    /**
     * Create a new blog post
     */
    createBlog: async (blogData) => {
        const response = await apiAdmin.post("/admin/blogs", blogData);
        return response.data;
    },

    /**
     * Update an existing blog post
     */
    updateBlog: async (id, blogData) => {
        const response = await apiAdmin.put(`/admin/blogs/${id}`, blogData);
        return response.data;
    },

    /**
     * Delete a blog post
     */
    deleteBlog: async (id) => {
        const response = await apiAdmin.delete(`/admin/blogs/${id}`);
        return response.data;
    },

    /**
     * Get blog titles from the last 30 days
     */
    getRecentTitles: async () => {
        const response = await apiAdmin.get("/admin/blogs/recent-titles");
        return response.data;
    },

    /**
     * Suggest blog titles based on a topic
     */
    suggestTitles: async (topic) => {
        const response = await apiAdmin.post("/admin/blogs/generate", { topic, type: "suggest-titles" });
        return response.data;
    },

    /**
     * Generate full blog content using AI
     */
    generateBlogContent: async (topic, selectedTitle, type = "generate-content", existingContent = null, history = []) => {
        const response = await apiAdmin.post("/admin/blogs/generate", { topic, selectedTitle, type, existingContent, history });
        return response.data;
    },

    /**
     * Upload an image for the blog post
     */
    uploadImage: async (formData) => {
        const response = await apiAdmin.post("/admin/blogs/upload-image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    /**
     * Delete an uploaded image
     */
    deleteImage: async (publicId) => {
        const response = await apiAdmin.delete("/admin/blogs/delete-image", {
            data: { publicId }
        });
        return response.data;
    }
};
