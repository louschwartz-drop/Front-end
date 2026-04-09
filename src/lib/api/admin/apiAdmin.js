import axios from "axios";

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
      const adminAuthStorage = localStorage.getItem("admin-auth-storage");
      if (adminAuthStorage) {
        const { state } = JSON.parse(adminAuthStorage);
        const token = state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
      return Promise.reject({
        success: false,
        message: error.response.data?.message || "Admin API Error",
      });
    } else if (error.request) {
      return Promise.reject({
        success: false,
        message: "No response from admin server.",
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || "Unexpected error occurred.",
      });
    }
  },
);

export default apiAdmin;
