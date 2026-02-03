// Auth service
import api from "../axios";

export const authService = {
  loginWithGoogle: async (idToken) => {
    const response = await api.post("/user/auth/login/google", {
      idToken,
    });
    return response.data;
  },
};
