import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/lib/api/user/auth"; // Use @ alias

const userAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login with Google
      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.loginWithGoogle(idToken);

          // Set cookie (better to use a cookie library like 'js-cookie')
          document.cookie = `auth_token=${response.token}; path=/; max-age=604800; SameSite=Lax; Secure`;

          set({
            user: response.data,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Login failed",
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        // Remove cookie
        document.cookie =
          "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        set({
          user: null,
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

      // Initialize auth from token (call this on app load)
      initializeAuth: () => {
        const token = get().token;
        if (token) {
          set({ isAuthenticated: true });
        }
      },

      // Update user data in store
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // Explicitly use localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default userAuthStore;
