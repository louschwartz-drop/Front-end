import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const supportService = {
    addSupportTicket: async (ticketData) => {
        try {
            const response = await axios.post(`${API_URL}/user/support/add`, ticketData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};
