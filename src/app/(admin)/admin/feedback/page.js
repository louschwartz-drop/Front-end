"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllFeedbacks, updateFeedbackStatus } from "@/lib/api/admin/feedback";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, Star, Search, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);

  const FEEDBACK_TYPES = ["All", "Give feedback", "Report a bug", "Suggest an improvement", "Other"];
  const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Closed"];

  const formatDate = (dateInput) => {
    return new Date(dateInput).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateInput) => {
    return new Date(dateInput).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const response = await getAllFeedbacks();
      if (response.success) {
        setFeedbacks(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch feedbacks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateFeedbackStatus(id, newStatus);
      if (response.success) {
        toast.success("Bug status updated successfully");
        setFeedbacks((prev) =>
          prev.map((fb) => (fb._id === id ? { ...fb, status: newStatus } : fb))
        );
        setOpenStatusDropdownId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => {
          const isFull = rating >= i + 1;
          const isHalf = rating >= i + 0.5 && !isFull;
          return (
            <div key={i} className="text-yellow-400">
              {isFull ? (
                <Star className="w-4 h-4 fill-current" />
              ) : isHalf ? (
                <div className="relative w-4 h-4">
                  <Star className="w-4 h-4 text-gray-300 absolute inset-0" />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                  </div>
                </div>
              ) : (
                <Star className="w-4 h-4 text-gray-300" />
              )}
            </div>
          );
        })}
        <span className="text-xs text-gray-500 font-medium ml-1">{rating}</span>
      </div>
    );
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const matchesSearch =
        (fb.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fb.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "All" || fb.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [feedbacks, searchTerm, typeFilter]);

  const averageRating = useMemo(() => {
    const ratedFeedbacks = feedbacks.filter((fb) => fb.type === "Give feedback" && fb.rating);
    if (ratedFeedbacks.length === 0) return 0;
    const total = ratedFeedbacks.reduce((acc, fb) => acc + (fb.rating || 0), 0);
    return (total / ratedFeedbacks.length).toFixed(1);
  }, [feedbacks]);

  const getStatusColor = (status) => {
    if (status === "Resolved" || status === "Closed") return "bg-green-100 text-green-700";
    if (status === "In Progress") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  /* ─── Status Dropdown (shared between card & table) ─── */
  const StatusDropdown = ({ feedback }) => (
    feedback.type === "Report a bug" ? (
      <div className="relative">
        <button
          onClick={() =>
            setOpenStatusDropdownId(openStatusDropdownId === feedback._id ? null : feedback._id)
          }
          className={`flex items-center justify-between border text-[10px] font-black uppercase tracking-widest rounded-lg w-28 sm:w-32 p-1.5 pl-3 outline-none transition-all hover:opacity-80 shadow-sm ${getStatusColor(feedback.status || "Pending")}`}
        >
          <span className="truncate">{feedback.status || "Pending"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${openStatusDropdownId === feedback._id ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {openStatusDropdownId === feedback._id && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOpenStatusDropdownId(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-40 overflow-hidden p-1.5"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleStatusChange(feedback._id, opt)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                      (feedback.status || "Pending") === opt
                        ? getStatusColor(opt)
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {opt}
                    {(feedback.status || "Pending") === opt && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    ) : (
      <span className="text-gray-300 text-sm font-medium">—</span>
    )
  );

  return (
    <div className="mx-auto">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 mt-1 sm:mt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Feedback</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          View all feedback, track bug reports, and manage user suggestions.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8">

        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium text-sm text-gray-800"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm self-start sm:self-auto">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 shrink-0">Type</label>
          <div className="relative">
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue w-40 sm:w-48 p-2 pl-3 outline-none transition-all hover:border-brand-blue/40"
            >
              <span className="truncate">{typeFilter}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isTypeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTypeDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 sm:w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
                  >
                    {FEEDBACK_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeFilter(type);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          typeFilter === type
                            ? "bg-brand-light text-brand-dark"
                            : "text-gray-600 hover:bg-gray-50 hover:text-brand-blue"
                        }`}
                      >
                        {type}
                        {typeFilter === type && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Avg Rating Badge */}
        {averageRating > 0 && (
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm self-start sm:self-auto">
            <div className="p-2.5 bg-brand-blue rounded-xl text-white shadow-sm shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div className="pr-2 sm:pr-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Rating</p>
              <div className="flex items-center gap-1 leading-none mt-1">
                <span className="text-lg font-black text-brand-blue">{averageRating}</span>
                <span className="text-sm font-bold text-gray-400">/ 5.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto mb-4" />
            <p className="font-medium">Loading feedbacks...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center p-12">
            <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Feedbacks Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filtering.</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE CARD LIST (hidden on md+) ── */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredFeedbacks.map((feedback) => (
                <div key={feedback._id} className="p-4 space-y-3">
                  {/* Row 1: User + Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {feedback.user?.name || "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium truncate">
                        {feedback.user?.email || "No email"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-gray-800">{formatDate(feedback.createdAt)}</p>
                      <p className="text-[10px] text-gray-400">{formatTime(feedback.createdAt)}</p>
                    </div>
                  </div>

                  {/* Row 2: Type badge + Stars */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-lg bg-blue-50 text-brand-blue border border-blue-100/50">
                      {feedback.type}
                    </span>
                    {feedback.type === "Give feedback" && renderStars(feedback.rating)}
                  </div>

                  {/* Row 3: Message */}
                  <div className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 max-h-28 overflow-y-auto leading-relaxed">
                    {feedback.message}
                  </div>

                  {/* Row 4: Status (only for bugs) */}
                  {feedback.type === "Report a bug" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status:</span>
                      <StatusDropdown feedback={feedback} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── DESKTOP TABLE (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 min-w-[720px]">
                <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">User Info</th>
                    <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">Type & Rating</th>
                    <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500 w-[35%]">Message</th>
                    <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">Status</th>
                    <th className="px-5 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFeedbacks.map((feedback) => (
                    <tr key={feedback._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight">
                            {feedback.user?.name || "Unknown"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {feedback.user?.email || "No email"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col space-y-1.5">
                          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-lg bg-blue-50 text-brand-blue max-w-max border border-blue-100/50">
                            {feedback.type}
                          </span>
                          {feedback.type === "Give feedback" && renderStars(feedback.rating)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 max-h-32 overflow-y-auto leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          {feedback.message}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusDropdown feedback={feedback} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-900 font-bold text-xs whitespace-nowrap">
                            {formatDate(feedback.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium mt-0.5 whitespace-nowrap">
                            {formatTime(feedback.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
