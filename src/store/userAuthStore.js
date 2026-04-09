import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/lib/api/user/auth";
import { profileService } from "@/lib/api/user/profile";

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

          // Set cookie (30 days expiry)
          document.cookie = `auth_token=${response.token}; path=/; max-age=2592000; SameSite=Lax; Secure`;

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

      // Sync auth state with cookie
      checkAuthSync: () => {
        const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
        const { token, isAuthenticated } = get();

        if (isAuthenticated && !hasCookie) {
          console.warn("Auth cookie missing, logging out...");
          get().logout();
          return false;
        }
        
        if (!isAuthenticated && hasCookie && token) {
           set({ isAuthenticated: true });
        }

        return hasCookie;
      },

      // Update user data in store
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },

      // Refresh user from backend
      refreshUser: async () => {
        const userId = get().user?._id || get().user?.id;

        if (!userId) return;

        try {
          const response = await profileService.getProfile(userId);
          if (response.success) {
            set({ user: response.data });
          }
        } catch (error) {
          console.error("Failed to refresh user profile:", error, error.response?.data);
        }
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
