"use client";

import { useState, useEffect } from "react";
// import { adminService } from '../../../services/adminService';
import Button from "@/components/ui/Button";

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: "",
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // const response = await adminService.getActivityLogs(filters);
      setLogs(response.data?.logs || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      console.error("Error loading activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Activity Logs
        </h1>
        <p className="text-gray-600 mt-1">System activity and error logs</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Action
            </label>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]"
            >
              <option value="">All Actions</option>
              <option value="campaign.created">Campaign Created</option>
              <option value="campaign.updated">Campaign Updated</option>
              <option value="payment.completed">Payment Completed</option>
              <option value="distribution.success">Distribution Success</option>
              <option value="distribution.failed">Distribution Failed</option>
              <option value="user.login">User Login</option>
              <option value="user.register">User Register</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ page: 1, limit: 50, action: "" })}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.userId?.name || "System"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.resourceType}{" "}
                          {log.resourceId ? `#${log.resourceId.slice(-8)}` : ""}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.details
                            ? JSON.stringify(log.details).substring(0, 100)
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} logs
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page >= pagination.totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
