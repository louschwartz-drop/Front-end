"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminUserService } from "@/lib/api/admin/users";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ChevronUp, ChevronDown, DollarSign } from "lucide-react";
import PaymentHistoryModal from "@/components/admin/PaymentHistoryModal";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [paymentHistoryModal, setPaymentHistoryModal] = useState({
        isOpen: false,
        userId: null,
        userName: ""
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, dateFilter, currentPage, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setCurrentPage(1);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminUserService.getAllUsers({
                page: currentPage,
                limit: 10,
                search: searchTerm,
                date: dateFilter,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction
            });
            if (response && response.success) {
                setUsers(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalResults(response.pagination.total);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">
                    View and manage all registered users and their activities
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="relative flex-1 md:max-w-md">
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium"
                    />
                    <svg
                        className="absolute left-4 top-3 h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Joined Date</label>
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-40 p-2 outline-none transition-all cursor-pointer hover:border-primary/40"
                        />
                    </div>

                    {(searchTerm !== "" || dateFilter !== "") && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1">
                                                User Info
                                                {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Name & Email</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('campaignCount')}>
                                        <div className="flex items-center justify-center gap-1">
                                            Campaigns
                                            {sortConfig.key === 'campaignCount' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('totalSpending')}>
                                        <div className="flex items-center justify-center gap-1">
                                            Spending
                                            {sortConfig.key === 'totalSpending' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('pressReleaseCount')}>
                                        <div className="flex items-center justify-center gap-1">
                                            Press Releases
                                            {sortConfig.key === 'pressReleaseCount' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center gap-1">
                                            Joined Date
                                            {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors text-sm">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 leading-tight">
                                                        {user.name || "N/A"}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-blue-600">
                                                {user.campaignCount || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-green-600">
                                                ${(user.totalSpending || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-purple-600">
                                                {user.pressReleaseCount || 0}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/users/${user._id}/campaigns`}
                                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-blue-50 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Campaigns
                                                    </Link>
                                                    <Link
                                                        href={`/admin/users/${user._id}/press-releases`}
                                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
                                                    >
                                                        Press Releases
                                                    </Link>
                                                    <button
                                                        onClick={() => setPaymentHistoryModal({
                                                            isOpen: true,
                                                            userId: user._id,
                                                            userName: user.name
                                                        })}
                                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                                        title="Payment History"
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {(currentPage - 1) * 10 + 1} to{" "}
                        {Math.min(currentPage * 10, totalResults)}{" "}
                        of {totalResults} users
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <PaymentHistoryModal
                isOpen={paymentHistoryModal.isOpen}
                onClose={() => setPaymentHistoryModal(prev => ({ ...prev, isOpen: false }))}
                userId={paymentHistoryModal.userId}
                userName={paymentHistoryModal.userName}
            />
        </div>
    );
}
