import apiAdmin from "./apiAdmin";

/**
 * Admin Category API services
 */
export const adminCategoryService = {
    /**
     * Get all categories
     */
    getCategories: async () => {
        const response = await apiAdmin.get("/admin/categories");
        return response.data;
    },

    /**
     * Get a single category by ID
     */
    getCategoryById: async (id) => {
        const response = await apiAdmin.get(`/admin/categories/${id}`);
        return response.data;
    },

    /**
     * Create a new category
     */
    createCategory: async (categoryData) => {
        const response = await apiAdmin.post("/admin/categories", categoryData);
        return response.data;
    },

    /**
     * Update an existing category
     */
    updateCategory: async (id, categoryData) => {
        const response = await apiAdmin.put(`/admin/categories/${id}`, categoryData);
        return response.data;
    },

    /**
     * Delete a category
     */
    deleteCategory: async (id) => {
        const response = await apiAdmin.delete(`/admin/categories/${id}`);
        return response.data;
    }
};
