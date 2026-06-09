"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useSocket } from "@/context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "@/components/ui/Tooltip";

// Premium icons from Lucide React
import {
  Layers, Clock, CheckCircle, DollarSign, Video,
  Music, FileText, Globe, Plus, ArrowRight,
  ExternalLink, BarChart3, PieChart as PieIcon, LayoutDashboard,
  TrendingUp, Sparkles, ShieldCheck, Zap, X, CreditCard, AlertCircle
} from "lucide-react";

// Recharts components
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Modern Custom Tooltip for Recharts AreaChart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-2xl transition-all">
        <p className="text-xs font-bold text-slate-500 mb-1.5">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.stroke || pld.color }} />
            <span className="text-xs font-semibold text-slate-600">{pld.name}:</span>
            <span className="text-xs font-extrabold text-slate-900">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function DashboardContent() {
  const router = useRouter();
  const socket = useSocket();

  const { user, isAuthenticated, isLoading: authLoading } = userAuthStore();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pressReleases: 0,
    published: 0,
    processing: 0,
    drafts: 0,
    failed: 0,
    totalAmountSpent: 0,
  });

  const [activityData, setActivityData] = useState([]);

  // Handle mounting state to avoid Recharts hydration warnings in NextJS App Router
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  // Listen for real-time updates via Socket
  useEffect(() => {
    if (socket) {
      socket.on("campaign_updated", (data) => {
        loadDashboardData();
      });

      return () => {
        socket.off("campaign_updated");
      };
    }
  }, [socket]);

  const loadDashboardData = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const { dashboardService } = await import("@/lib/api/user/dashboard");
      const response = await dashboardService.getStats(userId);

      if (response.success) {
        setCampaigns(response.data.lastCampaigns || []);
        setStats(response.data.stats || {
          total: 0,
          pressReleases: 0,
          published: 0,
          processing: 0,
          drafts: 0,
          failed: 0,
          totalAmountSpent: 0,
        });
        setActivityData(response.data.activityData || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Safe credit plan retriever
  const getPlanCredits = (planName) => {
    if (!user || !user.planCredits || !Array.isArray(user.planCredits)) return 0;

    // 1. Try exact match
    let plan = user.planCredits.find(
      (pc) => pc.planName.toLowerCase() === planName.toLowerCase()
    );
    if (plan) return plan.remainingArticles || 0;

    // 2. Try substring match (e.g. matches "Pro" inside "Boost Pro")
    plan = user.planCredits.find(
      (pc) => pc.planName.toLowerCase().includes(planName.toLowerCase())
    );
    return plan ? plan.remainingArticles || 0 : 0;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      uploading: "bg-blue-50 text-blue-600 border border-blue-100",
      uploaded: "bg-blue-50 text-blue-600 border border-blue-100",
      transcribing: "bg-amber-50 text-amber-600 border border-amber-100",
      generating: "bg-purple-50 text-purple-600 border border-purple-100",
      finished: "bg-indigo-50 text-primary border border-indigo-100",
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
      published: "Published",
      submitted_successfully: "Submitted Successfully",
      failed: isLanguageError ? "Language Not Supported" : "Failed",
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

  // Pie chart calculations (Excluded processing state completely)
  const statusData = [
    { name: "Published", value: stats.published || 0, color: "#10B981" },
    { name: "Drafts / Ready", value: stats.drafts || 0, color: "#0A5CFF" },
    { name: "Failed", value: stats.failed || 0, color: "#EF4444" },
  ].filter(item => item.value > 0);

  const hasData = statusData.length > 0;
  const pieData = hasData ? statusData : [{ name: "No Campaigns", value: 1, color: "#F3F4F6" }];

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-primary"></div>
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage and track your campaigns and newsroom balance.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Tooltip text="View Profile" position="bottom">
            <Link href="/user/dashboard/profile" className="hidden md:flex items-center gap-3 hover:opacity-95 transition-opacity mr-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border border-slate-200 shadow-sm object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 shadow-sm">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || "User"}</p>
                <p className="text-[10px] text-slate-500 font-medium leading-none">{user?.email || ""}</p>
              </div>
            </Link>
          </Tooltip>
        </div>
      </div>

      {/* Row 1: Operations & Health Metrics (5 Cards - Height Standard) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-4">

        {/* Campaign Repository */}
        <Tooltip text="View all campaigns">
          <Link href="/user/dashboard/campaigns" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Campaign </p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-none">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">Total Campaigns</span>
            </p>
          </Link>
        </Tooltip>

        {/* Distributed / Published Releases */}
        <Tooltip text="View published releases">
          <Link href="/user/dashboard/press-releases" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Published</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-none">{stats.published}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Syndicated releases</span>
            </p>
          </Link>
        </Tooltip>

        {/* Ready for Publish */}
        <Tooltip text="View ready to publish drafts">
          <Link href="/user/dashboard/campaigns?status=finished" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Ready for Publish</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{stats.drafts}</p>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="truncate">Draft press releases</span>
            </p>
          </Link>
        </Tooltip>

        {/* Failed / Needs Review */}
        <Tooltip text="View failed releases">
          <Link href="/user/dashboard/campaigns?status=failed" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Failed Releases</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-none">{stats.failed}</p>
              </div>
              <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shrink-0">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">Validation failed</span>
            </p>
          </Link>
        </Tooltip>

        {/* Total Amount Invested (Now at 5th place) */}
        <Tooltip text="View payment history" position="bottom">
          <Link href="/user/dashboard/payment-history" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group block col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-1 truncate">Total Revenue</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">${stats.totalAmountSpent || 0}</p>
              </div>
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="truncate">Secure payments</span>
            </p>
          </Link>
        </Tooltip>
      </div>

      {/* Row 2: Balance Credits Tiers (3 Cards - Reduced Height & Border Radius) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-8">

        {/* Boost Credits Card */}
        <div
          className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Boost Credits</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-blue-500 transition-colors leading-none">{getPlanCredits("Boost")}</p>
            </div>
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Boost Plus Credits Card */}
        <div
          className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Boost + Credits</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-none">{getPlanCredits("Boost +")}</p>
            </div>
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Boost Pro Credits Card */}
        <div
          className="bg-white rounded-xl border border-slate-100 shadow-xs py-2.5 px-4 hover:shadow-md block col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-600/70 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 truncate">Boost Pro Credits</p>
              <p className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{getPlanCredits("Boost Pro")}</p>
            </div>
            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
              <ShieldCheck className="w-4 h-4" />
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
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Campaign Activity Trend</h3>
              <p className="text-xs text-slate-500 font-medium">6-month distribution of campaigns created vs. published</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Campaigns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Published</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            {mounted && activityData && activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A5CFF" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0A5CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Campaigns" stroke="#0A5CFF" strokeWidth={2} fillOpacity={1} fill="url(#colorCampaigns)" name="Total Campaigns" />
                  <Area type="monotone" dataKey="Published" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPublished)" name="Published" />
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
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Campaign Status Breakdown</h3>
            <p className="text-xs text-slate-500 font-medium">Distribution ratio of campaigns by current state</p>
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
                  <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats.total}</span>
                  <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500 mt-1">Total Items</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] py-12">
                <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Loading ratio ratios...</p>
              </div>
            )}
          </div>

          {/* Custom Modern Status Legend (No Processing) */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { name: "Published", count: stats.published || 0, color: "bg-emerald-500" },
              { name: "Drafts / Ready", count: stats.drafts || 0, color: "bg-primary" },
              { name: "Failed", count: stats.failed || 0, color: "bg-red-500" },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center p-1.5 hover:bg-slate-50 rounded-lg transition-all justify-center text-center">
                <span className={`w-2 h-2 rounded-full ${stat.color} shrink-0 mb-1`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 truncate leading-tight">{stat.name}</p>
                  <p className="text-xs font-extrabold text-slate-900 leading-none mt-0.5">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Recent Campaigns Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Campaigns</h2>
            <p className="text-xs text-slate-500 font-medium">Manage and track your campaigns and distribution pipelines.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Tooltip text="View your campaigns">
              <Button
                onClick={() => router.push("/user/dashboard/campaigns")}
                variant="outline"
                className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                See All Campaigns
              </Button>
            </Tooltip>
            <Tooltip text="Start a new campaign">
              <Button
                onClick={() => router.push("/user/dashboard/create")}
                variant="primary"
                className="bg-primary hover:bg-brand-blue text-white px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Create Campaign
              </Button>
            </Tooltip>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
            <LayoutDashboard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600 mb-1">No campaigns found</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Get started by creating your first press release campaign.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((campaign) => (
              <Link
                key={campaign._id || campaign.id}
                href={
                  campaign.status === "finished"
                    ? `/user/edit/${campaign._id}`
                    : campaign.status === "failed"
                      ? `/user/dashboard/campaigns?status=failed`
                      : `/user/processing/${campaign._id}`
                }
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-50/30 -mx-6 px-6 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
                  {/* Custom Source Type Icon box with colors matching type */}
                  {(() => {
                    const srcType = campaign.metadata?.sourceType;
                    const videoSrc = campaign.videoSource;

                    let bg = "bg-primary/10 text-primary";
                    let IconComponent = Video;

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
                    <p className="font-bold text-sm text-slate-800 group-hover:text-primary truncate transition-colors pr-2">
                      {campaign.article?.headline || `Campaign #${campaign._id?.slice(-8)}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-400 font-semibold">
                        {(() => {
                          const src = campaign.videoSource || "";
                          if (campaign.metadata?.sourceType === 'record_audio') return 'Audio Record';
                          if (campaign.metadata?.sourceType === 'record_video') return 'Video Record';
                          if (src === 'document_upload') return 'Document Upload';
                          if (src === 'social_link') return 'From Social Link';
                          return 'Upload Video';
                        })()}
                      </span>
                      <span className={`md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusColor(campaign.status)}`}>
                        {getStatusLabel(campaign)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
                  <span className={`hidden md:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign)}
                  </span>

                  <div className="flex items-center gap-3">
                    {campaign.status === "finished" && (
                      <span className="text-primary text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                        Publish Now
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Credits & Balance Details Modal - Commented out for now
      <AnimatePresence>
        {isCreditsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">Newsroom Plan Balance</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Check and manage your active press release credits</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreditsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                
                <div className="flex items-center justify-between p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl group hover:border-blue-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100/40 text-blue-600 rounded-xl mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Boost Tier</h4>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">Standard local news network syndication</p>
                      <ul className="text-[9px] text-slate-500 font-medium mt-1 list-disc list-inside space-y-0.5">
                        <li>700 Words limit</li>
                        <li>1 Embedded Image & 1 Embedded Video</li>
                        <li>Detailed Distribution Reports</li>
                        <li>Basic RSS Syndication</li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Available</span>
                    <p className="text-xl font-extrabold text-blue-600 leading-none mt-1">{getPlanCredits("Boost")} releases</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl group hover:border-amber-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100/40 text-amber-500 rounded-xl mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Boost + Tier</h4>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">Expanded premium national channel distribution</p>
                      <ul className="text-[9px] text-slate-500 font-medium mt-1 list-disc list-inside space-y-0.5">
                        <li>1,000 Words limit</li>
                        <li>3 Embedded Images & 1 Embedded Video</li>
                        <li>RSS Syndication & Quote Embeds</li>
                        <li>Google My Business (GMB) Integration</li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Available</span>
                    <p className="text-xl font-extrabold text-amber-600 leading-none mt-1">{getPlanCredits("Boost +")} releases</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl group hover:border-indigo-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100/40 text-indigo-500 rounded-xl mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Boost Pro Tier</h4>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">High-impact global distribution network</p>
                      <ul className="text-[9px] text-slate-500 font-medium mt-1 list-disc list-inside space-y-0.5">
                        <li>2,500 Words limit</li>
                        <li>5 Embedded Images & 1 Embedded Video</li>
                        <li>GMB Map Listing Inclusion</li>
                        <li>Full Stock Symbol & Quote Embed</li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Available</span>
                    <p className="text-xl font-extrabold text-indigo-600 leading-none mt-1">{getPlanCredits("Boost Pro")} releases</p>
                  </div>
                </div>

              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsCreditsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-850 transition-all cursor-pointer shadow-xs"
                >
                  Close Window
                </button>
                <button
                  onClick={() => {
                    setIsCreditsModalOpen(false);
                    router.push("/user/dashboard/campaigns");
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-brand-blue text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Purchase Credits</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      */}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-500 font-semibold text-sm">Loading dashboard page...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
