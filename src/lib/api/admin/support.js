import apiAdmin from "./apiAdmin";

export const adminSupportService = {
    getAllSupportTickets: async ({ page = 1, limit = 10, search = "" }) => {
        const response = await apiAdmin.get("/admin/support/all", {
            params: { page, limit, search },
        });
        return response.data;
    },
    getOneSupportTicket: async (id) => {
        const response = await apiAdmin.get(`/admin/support/${id}`);
        return response.data;
    },
    updateTicketStatus: async (id, status) => {
        const response = await apiAdmin.patch(
            `/admin/support/update-status/${id}`,
            { status }
        );
        return response.data;
    },
};
