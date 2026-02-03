import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { adminAuthService } from "@/lib/api/admin/auth";

const adminAuthStore = create(
    persist(
        (set, get) => ({
            // State
            admin: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Login
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await adminAuthService.login(email, password);

                    // Set cookie for middleware
                    document.cookie = `admin_token=${response.token}; path=/; max-age=86400; SameSite=Lax; Secure`;

                    set({
                        admin: response.data,
                        token: response.token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    return response;
                } catch (error) {
                    const message =
                        error.response?.data?.message || error.message || "Login failed";
                    set({
                        admin: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: message,
                    });
                    throw new Error(message);
                }
            },

            // Logout
            logout: () => {
                // Remove cookie
                document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

                set({
                    admin: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            },

            // Update admin data in store
            updateAdmin: (adminData) => {
                set((state) => ({
                    admin: { ...state.admin, ...adminData }
                }));
            },
        }),
        {
            name: "admin-auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                admin: state.admin,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);

export default adminAuthStore;
