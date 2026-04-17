"use client";

import { useState, useEffect } from "react";
import userAuthStore from "@/store/userAuthStore";
import { paymentService } from "@/lib/api/user/payments";
import {
    CreditCard,
    Calendar,
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    DollarSign,
    Filter,
    ArrowUpRight,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";

export default function PaymentHistoryPage() {
    const { user } = userAuthStore();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [tempDateRange, setTempDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const today = new Date().toISOString().split('T')[0];

    const clearFilters = () => {
        setSearchTerm("");
        setDateRange({ startDate: "", endDate: "" });
        setTempDateRange({ startDate: "", endDate: "" });
        setCurrentPage(1);
    };

    const handleApplyDateFilter = () => {
        setDateRange(tempDateRange);
        setIsDateModalOpen(false);
        setCurrentPage(1);
    };

    const openDateModal = () => {
        setTempDateRange(dateRange);
        setIsDateModalOpen(true);
    };
    
    const closeDateModal = () => {
        setIsDateModalOpen(false);
    };

    const fetchHistory = async () => {
        if (!user?.id && !user?._id) return;
        setLoading(true);
        try {
            const response = await paymentService.getHistory({
                userId: user.id || user._id,
                page: currentPage,
                limit: 10,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                search: searchTerm
            });

            if (response.success) {
                setPayments(response.data);
                setTotalPages(response.pagination.totalPages);
                setTotalResults(response.pagination.total);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHistory();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [user, currentPage, dateRange.startDate, dateRange.endDate, searchTerm]);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Payment History</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your distribution plan purchases.</p>
                </div>

                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by plan name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Desktop Date Filter */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                max={dateRange.endDate || today}
                                className="text-xs font-bold text-gray-700 outline-none w-32"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                            <span className="text-gray-300">to</span>
                            <input
                                type="date"
                                min={dateRange.startDate}
                                max={today}
                                className="text-xs font-bold text-gray-700 outline-none w-32"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <button
                        onClick={openDateModal}
                        className={`md:hidden flex items-center justify-center p-1.5 rounded-md border transition-all shadow-sm ${
                            dateRange.startDate || dateRange.endDate 
                            ? "bg-blue-50 border-blue-200 text-blue-600" 
                            : "bg-white border-gray-200 text-gray-400"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        {(dateRange.startDate || dateRange.endDate) && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border border-white" />
                        )}
                    </button>

                    {(searchTerm || dateRange.startDate || dateRange.endDate) && (
                        <button
                            onClick={clearFilters}
                            className="hidden xs:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {loading && payments.length === 0 ? (
                <div className="flex justify-center py-10 md:py-20">
                    <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary"></div>
                </div>
            ) : payments.length === 0 ? (
                <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <div className="p-4 md:p-6 bg-gray-50 rounded-full">
                            <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                        </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">No Transactions Found</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 max-w-xs md:max-w-sm mx-auto font-medium px-4">
                        {dateRange.startDate || dateRange.endDate
                            ? "No transactions match the selected date range."
                            : "You haven't made any purchases yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-gray-400">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-gray-400">Plan Name</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-gray-400">Releases</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-gray-400 text-right">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={payment._id} className="border-t border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-gray-900">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 capitalize">
                                                    {payment.planId?.name || "Distribution Plan"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-gray-500">
                                                {payment.releasesGenerated} Credits
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-blue-600">
                                                {formatAmount(payment.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden space-y-3">
                        {payments.map((payment) => (
                            <div key={payment._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-gray-400">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </p>
                                        <h3 className="text-sm font-bold text-gray-900 capitalize leading-tight">
                                            {payment.planId?.name || "Distribution Plan"}
                                        </h3>
                                    </div>
                                    <span className="text-sm font-black text-blue-600">
                                        {formatAmount(payment.amount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3" />
                                        {payment.releasesGenerated} Release Credits
                                    </span>
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full border border-green-100 uppercase tracking-widest">
                                        Success
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalResults={totalResults}
                        itemsPerPage={10}
                        className="mt-0"
                    />
                </div>
            )}

            {/* Mobile Date Filter Modal */}
            <AnimatePresence>
                {isDateModalOpen && (
                    <div className="fixed inset-0 z-[70] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-sm"
                                onClick={closeDateModal}
                            />

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                                &#8203;
                            </span>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative z-[80] inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-8"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Filter by Date</h3>
                                    <button 
                                        onClick={closeDateModal}
                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            max={tempDateRange.endDate || today}
                                            value={tempDateRange.startDate}
                                            onChange={(e) => setTempDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            min={tempDateRange.startDate}
                                            max={today}
                                            value={tempDateRange.endDate}
                                            onChange={(e) => setTempDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            onClick={clearFilters}
                                            className="flex-1 px-4 py-2 border border-gray-100 text-gray-500 text-xs font-semibold rounded-md hover:bg-gray-50 transition-all"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleApplyDateFilter}
                                            className="flex-2 px-6 py-2 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all"
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
