import apiClient from "../axios";

export const adminAuthService = {
    login: async (email, password) => {
        const response = await apiClient.post("/admin/auth/login", {
            email,
            password,
        });
        return response.data;
    },

    getProfile: async () => {
        const response = await apiClient.get("/admin/auth/me");
        return response.data;
    },
};
