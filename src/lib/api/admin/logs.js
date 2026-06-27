import apiAdmin from "./apiAdmin";

export const getSystemLogs = async (params) => {
  const response = await apiAdmin.get('/admin/system-logs', { params });
  return response.data;
};

export const deleteSystemLogs = async (ids) => {
  const response = await apiAdmin.post('/admin/system-logs/delete', { ids });
  return response.data;
};

export const resolveSystemLog = async (id) => {
  const response = await apiAdmin.patch(`/admin/system-logs/${id}/resolve`);
  return response.data;
};
