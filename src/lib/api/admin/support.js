import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const adminSupportService = {
    getAllSupportTickets: async ({ page = 1, limit = 10, search = "" }) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await axios.get(`${API_URL}/admin/support/all`, {
                params: { page, limit, search },
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getOneSupportTicket: async (id) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await axios.get(`${API_URL}/admin/support/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    updateTicketStatus: async (id, status) => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await axios.patch(
                `${API_URL}/admin/support/update-status/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};
