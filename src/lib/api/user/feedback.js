import api from "../axios";

export const submitFeedback = async (data) => {
  const response = await api.post("/user/feedback", data);
  return response.data;
};
