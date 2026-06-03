// -----------------------------
// File: lib/axios.js
// Axios utility with baseURL, interceptors, and proper error handling
// -----------------------------

import axios from "axios";
import userAuthStore from "@/store/userAuthStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (error) {
      console.error("Error setting auth header:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Catch authentication errors globally
      if (error.response.status === 401) {
        console.warn("🔐 401 Unauthorized detected. Logging out user...");
        if (typeof window !== "undefined") {
          userAuthStore.getState().logout();
          // Avoid looping if we are already on the auth page
          if (window.location.pathname !== "/user/auth") {
            window.location.href = "/user/auth";
          }
        }
      }

      return Promise.reject({
        success: false,
        message:
          error.response.data?.message ||
          "Something went wrong. Please try again.",
      });
    } else if (error.request) {
      return Promise.reject({
        success: false,
        message: "Network error: No response from server. Please check your connection.",
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || "An unexpected error occurred during the request.",
      });
    }
  },
);

export default api;
