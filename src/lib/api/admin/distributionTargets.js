import apiAdmin from "./apiAdmin";

export const distributionTargetService = {
    getAll: async () => {
        const response = await apiAdmin.get("/admin/distribution-targets");
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiAdmin.put(`/admin/distribution-targets/${id}`, data);
        return response.data;
    }
};
