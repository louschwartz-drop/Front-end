"use client";

import { useState, useEffect } from "react";
import { adminSupportService } from "@/lib/api/admin/support";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { Search, Loader2, Calendar, User, Mail, MessageSquare, ChevronRight, Filter } from "lucide-react";
import TicketDetailsModal from "@/components/admin/TicketDetailsModal";

const STATUS_PILL = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    "In Progress": "bg-blue-50 text-blue-700 border-blue-100",
    Completed: "bg-green-50 text-green-700 border-green-100",
    Rejected: "bg-red-50 text-red-700 border-red-100",
};

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTickets();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentPage]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await adminSupportService.getAllSupportTickets({
                page: currentPage,
                limit: 10,
                search: searchTerm
            });
            if (response && response.success) {
                setTickets(response.data || []);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalResults(response.pagination.total);
                }
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedTicket) return;
        try {
            setActionLoading(true);
            const response = await adminSupportService.updateTicketStatus(selectedTicket._id, status);
            if (response.success) {
                toast.success(`Ticket status updated to ${status}`);
                // Update local state
                setTickets(tickets.map(t => t._id === selectedTicket._id ? { ...t, status } : t));
                setSelectedTicket({ ...selectedTicket, status });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Queries</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2">
                    Manage and respond to user enquiries and support requests
                </p>
            </div>

            {/* Filter/Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        placeholder="Search by Ticket ID (e.g. TIC-XA12)..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm text-sm sm:text-base text-gray-900"
                    />
                    <Search className="absolute left-4 top-3 sm:top-4 h-5 w-5 text-gray-400" />
                </div>
            </div>

            {/* Content Table/Grid Card Area */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 sm:p-20 text-center">
                        <Loader2 className="animate-spin h-10 w-10 text-brand-blue mx-auto" />
                        <p className="mt-4 text-gray-500 font-medium text-sm sm:text-base">Loading tickets...</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table (hidden on mobile, visible on md and up) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {tickets.length > 0 ? (
                                        tickets.map((ticket) => (
                                            <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleOpenTicket(ticket)}
                                                        className="text-brand-blue font-bold hover:underline"
                                                    >
                                                        {ticket.ticketId}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{ticket.firstName}</span>
                                                        <span className="text-xs text-gray-500">{ticket.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_PILL[ticket.status]}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleOpenTicket(ticket)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-brand-blue hover:text-white transition-all text-sm font-medium border border-gray-100"
                                                    >
                                                        View Details
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                    <MessageSquare className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No support tickets found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid/Card View (visible below md) */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {tickets.length > 0 ? (
                                tickets.map((ticket) => (
                                    <div key={ticket._id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => handleOpenTicket(ticket)}
                                                className="text-brand-blue font-bold hover:underline text-base"
                                            >
                                                {ticket.ticketId}
                                            </button>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_PILL[ticket.status]}`}>
                                                {ticket.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="font-bold">{ticket.firstName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="truncate break-all">{ticket.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={() => handleOpenTicket(ticket)}
                                                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-brand-blue hover:text-white transition-all text-xs font-semibold border border-gray-150 shadow-sm"
                                            >
                                                View Details
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <MessageSquare className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">No support tickets found</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {tickets.length > 0 && (
                <div className="mt-6 flex justify-center sm:justify-end">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalResults={totalResults}
                        itemsPerPage={10}
                        className="mt-0 w-full sm:w-auto"
                    />
                </div>
            )}

            <TicketDetailsModal
                ticket={selectedTicket}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdateStatus={handleUpdateStatus}
                loading={actionLoading}
            />
        </div>
    );
}
