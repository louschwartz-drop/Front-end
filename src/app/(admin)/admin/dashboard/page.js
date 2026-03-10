"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0A5CFF",
  "#3B82F6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#f59e0b",
];

import adminAuthStore from "@/store/adminAuthStore";
import { adminDashboardService } from "@/lib/api/admin/dashboard";

function AdminDashboardContent() {
  const router = useRouter();
  const { isAuthenticated, admin: user } = adminAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminDashboardService.getStats();
      if (response && response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const campaignStatusData = stats?.campaigns?.byStatus
    ? [
      {
        name: "Draft",
        value: stats.campaigns.byStatus.draft || 0,
        color: "#6B7280",
      },
      {
        name: "In Progress",
        value: stats.campaigns.byStatus.inProgress,
        color: "#3B82F6",
      },
      {
        name: "Distributed",
        value: stats.campaigns.byStatus.distributed,
        color: "#10b981",
      },
      {
        name: "Failed",
        value: stats.campaigns.byStatus.failed,
        color: "#ef4444",
      },
    ]
    : [];

  return (
    <div className="">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome to Drop PR Admin Panel
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
            <div className="bg-gradient-to-br from-[#0A5CFF] to-[#3B82F6] rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats?.users?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Campaigns</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats?.campaigns?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Removed Revenue and Distributed cards if not needed, or kept consistent style */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Generated Articles (Last 7 Days)
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.salesData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="articles" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} name="Articles" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Campaigns
                </h2>
                <Link
                  href="/admin/campaigns"
                  className="text-[#0A5CFF] hover:text-[#3B82F6] text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                  stats.recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign._id}
                      href={`/admin/campaigns/${campaign._id}`} // Or open modal if prefered, but link is safe
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm group-hover:text-[#0A5CFF] transition-colors">
                          {campaign.campaignId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {campaign.userId?.name || "Unknown User"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block mb-1">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${campaign.status === "distributed" ? "bg-green-100 text-green-700" :
                            campaign.status === "failed" ? "bg-red-100 text-red-700" :
                              campaign.status === "inProgress" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {campaign.status || "draft"}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No recent campaigns found
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0A5CFF] hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#0A5CFF] transition-colors">
                  <svg className="w-6 h-6 text-[#0A5CFF] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Manage Users</span>
              </Link>

              <Link
                href="/admin/campaigns"
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0A5CFF] hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-500 transition-colors">
                  <svg className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Campaigns</span>
              </Link>

              <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0A5CFF] hover:bg-blue-50 transition-all group cursor-pointer">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Payments</span>
              </div>

              <Link
                href="/admin/profile"
                className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0A5CFF] hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-600 transition-colors">
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Profile</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
