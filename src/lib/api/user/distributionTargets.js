import api from "../axios";

export const distributionTargetService = {
    getAll: async () => {
        const response = await api.get("/user/distribution-targets");
        return response.data;
    }
};
