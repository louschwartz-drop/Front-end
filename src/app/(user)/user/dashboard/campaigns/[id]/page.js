"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";

import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = userAuthStore();
  const [campaign, setCampaign] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingProof, setDownloadingProof] = useState(false);
  const [editData, setEditData] = useState({
    headline: "",
    introduction: "",
    body: "",
  });

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadCampaign();
      const interval = setInterval(loadCampaign, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, params.id]);

  const loadCampaign = async () => {
    try {
      const response = await campaignService.getById(params.id);
      const campaignData = response.data?.campaign || response.data;
      setCampaign(campaignData);

      if (campaignData.article) {
        setArticle(campaignData.article);
        setEditData({
          headline: campaignData.article.headline || "",
          introduction: campaignData.article.introduction || "",
          body: campaignData.article.body || "",
        });
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await campaignService.updateArticle(params.id, editData);
      toast.success("Article updated successfully");
      setEditing(false);
      loadCampaign();
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error(error.response?.data?.message || "Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      await campaignService.approveArticle(params.id);
      toast.success("Article approved! Redirecting to payment...");
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${params.id}/payment`);
      }, 1500);
    } catch (error) {
      console.error("Error approving article:", error);
      toast.error(error.response?.data?.message || "Failed to approve article");
    }
  };

  const handleRetry = async () => {
    try {
      await campaignService.retry(params.id);
      toast.success("Campaign retry initiated");
      loadCampaign();
    } catch (error) {
      console.error("Error retrying campaign:", error);
      toast.error(error.response?.data?.message || "Failed to retry campaign");
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-700",
      uploading: "bg-blue-100 text-blue-700",
      transcribing: "bg-yellow-100 text-yellow-700",
      generating_article: "bg-purple-100 text-purple-700",
      awaiting_approval: "bg-amber-100 text-amber-700",
      awaiting_payment: "bg-indigo-100 text-indigo-700",
      paid: "bg-green-100 text-green-700",
      distributed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: "Draft",
      uploading: "Uploading",
      transcribing: "Transcribing",
      generating_article: "Generating Article",
      awaiting_approval: "Awaiting Approval",
      awaiting_payment: "Awaiting Payment",
      paid: "Paid",
      distributed: "Distributed",
      failed: "Failed",
    };
    return labels[status] || status;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Campaign not found</p>
        <Button onClick={() => router.push("/dashboard")} variant="primary">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Campaign #{campaign.campaignId}
            </h1>
            <p className="text-gray-600 mt-1">
              Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}
          >
            {getStatusLabel(campaign.status)}
          </span>
        </div>
      </div>

      {campaign.status === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Campaign Failed
              </h3>
              <p className="text-red-700 text-sm mb-3">
                {campaign.errorMessage || "An error occurred during processing"}
              </p>
              <Button
                onClick={handleRetry}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
              >
                Retry Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Video Source
          </h3>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {campaign.videoSource}
          </p>
          {campaign.videoLink && (
            <a
              href={campaign.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0A5CFF] hover:underline text-sm mt-2 block truncate"
            >
              {campaign.videoLink}
            </a>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Package</h3>
          <p className="text-lg font-semibold text-gray-900">
            {campaign.packageId?.name || "Starter Package"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            ${campaign.packageId?.price || "99.00"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Last Updated
          </h3>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(campaign.updatedAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(campaign.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {campaign.status === "awaiting_approval" && article && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Article Review</h2>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setEditData({
                        headline: article.headline || "",
                        introduction: article.introduction || "",
                        body: article.body || "",
                      });
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    disabled={saving}
                    className="bg-[#0A5CFF] hover:bg-[#3B82F6]"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditing(true)} variant="outline">
                    Edit Article
                  </Button>
                  <Button
                    onClick={handleApprove}
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve & Continue
                  </Button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  value={editData.headline}
                  onChange={(e) =>
                    setEditData({ ...editData, headline: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Introduction
                </label>
                <textarea
                  value={editData.introduction}
                  onChange={(e) =>
                    setEditData({ ...editData, introduction: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body
                </label>
                <textarea
                  value={editData.body}
                  onChange={(e) =>
                    setEditData({ ...editData, body: e.target.value })
                  }
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5CFF] font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {article.headline}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {article.introduction}
                </p>
              </div>
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {article.body}
                </div>
              </div>
              {article.quotes && article.quotes.length > 0 && (
                <div className="border-l-4 border-[#0A5CFF] pl-4 py-2 bg-blue-50 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Extracted Quotes
                  </h4>
                  {article.quotes.map((quote, index) => (
                    <blockquote
                      key={index}
                      className="text-gray-700 italic mb-2"
                    >
                      "{quote.text}"
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {campaign.status === "awaiting_payment" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Required
          </h2>
          <p className="text-gray-600 mb-4">
            Your article has been approved. Please complete payment to proceed
            with distribution.
          </p>
          <Button
            onClick={() =>
              router.push(`/dashboard/campaigns/${params.id}/payment`)
            }
            variant="primary"
            className="bg-[#0A5CFF] hover:bg-[#3B82F6]"
          >
            Proceed to Payment
          </Button>
        </div>
      )}

      {campaign.status === "distributed" && campaign.distributionId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-green-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                Article Published!
              </h3>
              <p className="text-green-700 text-sm mb-3">
                Your article has been successfully distributed.
              </p>
              <div className="flex gap-3">
                {campaign.distributionId?.publishedUrl && (
                  <a
                    href={campaign.distributionId.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A5CFF] hover:underline text-sm font-medium"
                  >
                    View Published Article →
                  </a>
                )}
                <Button
                  onClick={async () => {
                    try {
                      setDownloadingProof(true);
                      await campaignService.generateProof(params.id);
                      toast.success("PDF proof downloaded successfully");
                    } catch (error) {
                      console.error("Error downloading proof:", error);
                      toast.error("Failed to download PDF proof");
                    } finally {
                      setDownloadingProof(false);
                    }
                  }}
                  variant="outline"
                  disabled={downloadingProof}
                  className="text-sm"
                >
                  {downloadingProof ? "Generating..." : "Download PDF Proof"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {["uploading", "transcribing", "generating_article"].includes(
        campaign.status,
      ) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A5CFF]"></div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Processing in Progress
              </h3>
              <p className="text-blue-700 text-sm">
                Your campaign is being processed. This page will update
                automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
