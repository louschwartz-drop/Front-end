import axios from "axios";
import adminAuthStore from "@/store/adminAuthStore";

/**
 * Separate Axios instance for Admin API calls.
 * Isolates admin authentication from user authentication.
 */
const apiAdmin = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the admin auth token
apiAdmin.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const adminAuthStorage = localStorage.getItem("admin-auth-storage");
        if (adminAuthStorage) {
          const { state } = JSON.parse(adminAuthStorage);
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (error) {
      console.error("Error setting admin auth header:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for handling errors globally
apiAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Catch admin authentication errors globally
      if (error.response.status === 401) {
        console.warn("🔐 Admin 401 Unauthorized detected. Logging out admin...");
        if (typeof window !== "undefined") {
          adminAuthStore.getState().logout();
          if (window.location.pathname !== "/admin/login") {
            window.location.href = "/admin/login";
          }
        }
      }

      return Promise.reject(new Error(error.response.data?.message || "Admin API Error"));
    } else if (error.request) {
      return Promise.reject(new Error("No response from admin server."));
    } else {
      return Promise.reject(new Error(error.message || "Unexpected error occurred."));
    }
  },
);

export default apiAdmin;
