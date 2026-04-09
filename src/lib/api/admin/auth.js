import apiAdmin from "./apiAdmin";

export const adminAuthService = {
    login: async (email, password) => {
        const response = await apiAdmin.post("/admin/auth/login", {
            email,
            password,
        });
        return response.data;
    },

    getProfile: async () => {
        const response = await apiAdmin.get("/admin/auth/me");
        return response.data;
    },
};
