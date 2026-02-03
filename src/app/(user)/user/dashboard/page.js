"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";

import Link from "next/link";
import Button from "@/components/ui/Button";

function DashboardContent() {
  const router = useRouter();

  const { user, isAuthenticated, isLoading: authLoading } = userAuthStore();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pressReleases: 0,
    inProgress: 0,
    distributed: 0,
    failed: 0,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const { dashboardService } = await import("@/lib/api/user/dashboard");
      const response = await dashboardService.getStats(userId);

      if (response.success) {
        setCampaigns(response.data.lastCampaigns);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      uploading: "bg-blue-100 text-blue-700",
      uploaded: "bg-blue-100 text-blue-700",
      transcribing: "bg-yellow-100 text-yellow-700",
      generating: "bg-purple-100 text-purple-700",
      finished: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status) => {
    const labels = {
      uploading: "Uploading",
      uploaded: "Uploaded",
      transcribing: "Transcribing",
      generating: "Generating",
      finished: "Finished",
      failed: "Failed",
    };
    return labels[status] || status;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="bg-linear-to-r from-primary to-brand-blue rounded-xl p-6 mb-6 h-ful text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 shrink-0 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                {getInitials(user?.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Welcome, {user?.name || "User"}!
              </h1>
              <p className="text-blue-100 text-sm">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs mb-1">Total Campaigns</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-gray-500 to-gray-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-xs mb-1">Press Releases</p>
              <p className="text-2xl font-bold">{stats.pressReleases}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-xs mb-1">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs mb-1">Distributed</p>
              <p className="text-2xl font-bold">{stats.distributed}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs mb-1">Failed</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Recent Campaigns</h2>
          <Button
            onClick={() => router.push("/user/dashboard/create")}
            variant="primary"
            className="bg-primary hover:bg-brand-blue"
          >
            Create Campaign
          </Button>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-600 mb-2">No campaigns yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <Link
                key={campaign._id || campaign.id}
                href={campaign.status === "finished" ? `/user/edit/${campaign._id}` : `/user/processing/${campaign._id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 truncate max-w-[200px] md:max-w-md">
                      {campaign.article?.headline || `Campaign #${campaign._id?.slice(-8)}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(campaign.createdAt).toLocaleDateString()} •{" "}
                      {campaign.videoSource === "local_upload" ? "Upload" : "Link"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                  >
                    {getStatusLabel(campaign.status)}
                  </span>
                  {campaign.status === "finished" && (
                    <span className="text-primary text-sm font-semibold flex items-center gap-1">
                      Edit
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
