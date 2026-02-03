// -----------------------------
// File: lib/axios.js
// Axios utility with baseURL, interceptors, and proper error handling
// -----------------------------

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.log(error);
      return Promise.reject({
        success: false,
        message:
          error.response.data?.message ||
          "Something went wrong. Please try again.",
      });
    } else if (error.request) {
      console.log(error);
      return Promise.reject({
        success: false,
        message: "No response from server. Check your connection.",
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || "Unexpected error occurred.",
      });
    }
  },
);

export default api;
