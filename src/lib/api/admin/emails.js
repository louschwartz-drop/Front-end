import apiAdmin from "./apiAdmin";

export const adminEmailService = {
    sendBulkEmail: async (data) => {
        const response = await apiAdmin.post("/admin/emails/send-bulk", data);
        return response.data;
    },
    sendSpecificEmail: async (data) => {
        const response = await apiAdmin.post("/admin/emails/send-specific", data);
        return response.data;
    }
};
