import api from "../axios";

export const getAllFeedbacks = async () => {
  const response = await api.get("/admin/feedback");
  return response.data;
};

export const updateFeedbackStatus = async (id, status) => {
  const response = await api.patch(`/admin/feedback/${id}/status`, { status });
  return response.data;
};
