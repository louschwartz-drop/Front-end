"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import adminAuthStore from "@/store/adminAuthStore";
import { adminDashboardService } from "@/lib/api/admin/dashboard";

import {
  Users, Layers, DollarSign, CheckCircle, AlertCircle, 
  TrendingUp, Ticket, FileText, BarChart3, PieChart as PieIcon,
  Video, Music, Globe, ArrowRight, ExternalLink, ShieldCheck, Zap, MessageSquare, LifeBuoy
} from "lucide-react";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

// Modern Custom Tooltip for Recharts AreaChart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-2xl transition-all">
        <p className="text-xs font-bold text-slate-500 mb-1.5">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.stroke || pld.color || pld.fill }} />
            <span className="text-xs font-semibold text-slate-600">{pld.name}:</span>
            <span className="text-xs font-extrabold text-slate-900">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function AdminDashboardContent() {
  const router = useRouter();
  const { isAuthenticated, admin: user } = adminAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const statusData = stats?.campaigns?.bySource
    ? [
        { name: "Upload Video", value: stats.campaigns.bySource.uploadVideo || 0, color: "#0A5CFF" },
        { name: "Social Link", value: stats.campaigns.bySource.socialLink || 0, color: "#14B8A6" },
        { name: "Document Upload", value: stats.campaigns.bySource.documentUpload || 0, color: "#F59E0B" },
        { name: "Video Record", value: stats.campaigns.bySource.videoRecord || 0, color: "#F43F5E" },
        { name: "Audio Record", value: stats.campaigns.bySource.audioRecord || 0, color: "#A855F7" },
      ].filter((item) => item.value > 0)
    : [];

  const hasData = statusData.length > 0;
  const pieData = hasData ? statusData : [{ name: "No Campaigns", value: 1, color: "#F3F4F6" }];

  const getStatusColor = (status) => {
    const statusColors = {
      uploading: "bg-blue-50 text-blue-600 border border-blue-100",
      uploaded: "bg-blue-50 text-blue-600 border border-blue-100",
      transcribing: "bg-amber-50 text-amber-600 border border-amber-100",
      generating: "bg-purple-50 text-purple-600 border border-purple-100",
      finished: "bg-indigo-50 text-primary border border-indigo-100",
      distributed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      published: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      submitted_successfully: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      failed: "bg-rose-50 text-rose-600 border border-rose-100",
    };
    return statusColors[status] || "bg-gray-50 text-gray-600 border border-gray-100";
  };

  const getStatusLabel = (campaign) => {
    const status = campaign.status;
    const isLanguageError = campaign.errorMessage?.toLowerCase().includes("language");
    const labels = {
      uploading: "Uploading",
      uploaded: "Uploaded",
      transcribing: "Transcribing",
      generating: "Generating",
      finished: "Ready for Publish",
      distributed: "Distributed",
      published: "Published",
      submitted_successfully: "Submitted Successfully",
      failed: isLanguageError ? "Language Not Supported" : "Failed",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-[#0A5CFF]"></div>
        </div>
        <p className="text-slate-500 font-semibold text-sm animate-pulse tracking-wide text-center">
          Loading dashboard environment...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sleek Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Platform overview and system health metrics.</p>
        </div>
      </div>

      {/* Row 1: Operations & Health Metrics (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-4">
        {/* Total Users */}
        <Link href="/admin/users" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Total Users</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{stats?.users?.total || 0}</p>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Registered accounts</span>
          </p>
        </Link>

        {/* Total Campaigns */}
        <Link href="/admin/campaigns" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Campaigns</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-[#0A5CFF] transition-colors leading-none">{stats?.campaigns?.total || 0}</p>
            </div>
            <div className="w-8 h-8 bg-[#0A5CFF]/10 rounded-xl flex items-center justify-center text-[#0A5CFF] group-hover:bg-[#0A5CFF] group-hover:text-white transition-all shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Total generated</span>
          </p>
        </Link>

        {/* Distributed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Distributed</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-none">{stats?.campaigns?.byStatus?.distributed || 0}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Successfully published</span>
          </p>
        </div>

        {/* Support Tickets */}
        <Link href="/admin/support" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Support Tickets</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-none">{stats?.support?.totalTickets || 0}</p>
            </div>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Total inquiries</span>
          </p>
        </Link>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Platform Revenue</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">${stats?.revenue?.total || 0}</p>
            </div>
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="truncate">Total transactions</span>
          </p>
        </div>
      </div>

      {/* Row 2: Secondary Metrics (3 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-8">
        {/* Promo Codes Used */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Promo Codes Used</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-purple-500 transition-colors leading-none">{stats?.promoCodes?.total || 0}</p>
            </div>
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Feedbacks */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md transition-all group block">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Total Feedbacks</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-teal-500 transition-colors leading-none">{stats?.feedbacks?.total || 0}</p>
            </div>
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-all shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Contact Queries */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md transition-all group block col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Contact Queries</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-none">{stats?.support?.totalTickets || 0}</p>
            </div>
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Area Chart (Col Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Article Generation Trend</h3>
              <p className="text-xs text-slate-500 font-medium">Articles generated over the last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A5CFF]" />
                <span>Generated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Published</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            {mounted && stats?.salesData && stats.salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A5CFF" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0A5CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="articles" stroke="#0A5CFF" strokeWidth={2} fillOpacity={1} fill="url(#colorArticles)" name="Generated" />
                  <Area type="monotone" dataKey="published" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPublished)" name="Published" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] bg-slate-50/30 rounded-xl border border-dashed border-slate-100 py-12">
                <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Activity insights loading...</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart (Col Span 1) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Campaign Source Distribution</h3>
            <p className="text-xs text-slate-500 font-medium">Breakdown of campaigns by input method</p>
          </div>

          <div className="relative w-full flex items-center justify-center py-2 h-[200px]">
            {mounted ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value, name) => [hasData ? value : 0, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats?.campaigns?.total || 0}</span>
                  <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500 mt-1">Total</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] py-12">
                <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Loading ratio ratios...</p>
              </div>
            )}
          </div>

          {/* Custom Modern Status Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center p-1.5 hover:bg-slate-50 rounded-lg transition-all justify-center text-center">
                <span className={`w-2 h-2 rounded-full shrink-0 mb-1`} style={{ backgroundColor: stat.color }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 truncate leading-tight">{stat.name}</p>
                  <p className="text-xs font-extrabold text-slate-900 leading-none mt-0.5">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Campaigns</h2>
            <p className="text-xs text-slate-500 font-medium">Latest campaign activities across the platform.</p>
          </div>
          <Link
            href="/admin/campaigns"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            See All Campaigns
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!stats?.recentCampaigns || stats.recentCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600 mb-1">No recent campaigns found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentCampaigns.map((campaign) => (
              <Link
                key={campaign._id}
                href={`/admin/users/${campaign.userId?._id}/campaigns`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-50/30 -mx-6 px-6 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
                  {/* Custom Source Type Icon box with colors matching type */}
                  {(() => {
                    const srcType = campaign.metadata?.sourceType;
                    const videoSrc = campaign.videoSource;

                    let bg = "bg-blue-50 text-blue-600";
                    let IconComponent = Layers;

                    if (srcType === 'record_audio') {
                      bg = "bg-purple-50 text-purple-600";
                      IconComponent = Music;
                    } else if (srcType === 'record_video') {
                      bg = "bg-rose-50 text-rose-600";
                      IconComponent = Video;
                    } else if (videoSrc === 'document_upload') {
                      bg = "bg-amber-50 text-amber-600";
                      IconComponent = FileText;
                    } else if (videoSrc === 'social_link') {
                      bg = "bg-teal-50 text-teal-600";
                      IconComponent = Globe;
                    }

                    return (
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-all`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                    );
                  })()}

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-800 group-hover:text-[#0A5CFF] truncate transition-colors pr-2">
                      {campaign.article?.headline || campaign.campaignId || `Campaign #${campaign._id?.slice(-8)}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-medium">
                        {campaign.userId?.name || "Unknown User"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-400">
                        {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign)}
                  </span>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0A5CFF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
