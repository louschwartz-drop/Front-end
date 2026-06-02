import apiAdmin from "./apiAdmin";

export const getAllFeedbacks = async () => {
  const response = await apiAdmin.get("/admin/feedback");
  return response.data;
};

export const updateFeedbackStatus = async (id, status) => {
  const response = await apiAdmin.patch(`/admin/feedback/${id}/status`, { status });
  return response.data;
};

export const deleteFeedback = async (id) => {
  const response = await apiAdmin.delete(`/admin/feedback/${id}`);
  return response.data;
};
