"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminCampaignService } from "@/lib/api/admin/campaigns";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ArticlePreviewModal from "./ArticlePreviewModal";

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [filters]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await adminCampaignService.getCampaigns(filters);
      setCampaigns(response.data?.campaigns || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Campaign Management
        </h1>
        <p className="text-gray-600 mt-1">View and manage all campaigns</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              placeholder="Campaign ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="uploading">Uploading</option>
              <option value="transcribing">Transcribing</option>
              <option value="generating_article">Generating Article</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="paid">Paid</option>
              <option value="distributed">Distributed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() =>
                setFilters({ page: 1, limit: 20, status: "", search: "" })
              }
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
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
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
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated Text
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No campaigns found
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {campaign.userId?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {campaign.userId?.email || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {campaign.videoUrl ? (
                            <a
                              href={campaign.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-blue hover:underline text-sm"
                            >
                              View Video
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">Local Upload</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500 text-sm line-clamp-1 max-w-xs block">
                            {campaign.article?.headline || campaign.article?.body || "No text generated"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewCampaign(campaign)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-brand-blue bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            View
                          </button>
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
                of {pagination.total} campaigns
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

      <ArticlePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
      />
    </div>
  );
}
