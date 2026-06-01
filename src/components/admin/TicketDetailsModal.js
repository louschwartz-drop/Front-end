"use client";

import { X, Clock, User, Mail, Building, Briefcase, MessageSquare, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import Button from "../ui/Button";

const STATUS_COLORS = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    Completed: "bg-green-100 text-green-800 border-green-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function TicketDetailsModal({ ticket, isOpen, onClose, onUpdateStatus, loading }) {
    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 bg-brand-blue/10 rounded-lg flex-shrink-0">
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{ticket.ticketId}</h2>
                            <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">Submitted on {new Date(ticket.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 min-h-0">
                    {/* Status Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[ticket.status]}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {["Pending", "In Progress", "Completed", "Rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => onUpdateStatus(status)}
                                    disabled={loading || ticket.status === status}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${ticket.status === status
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white border border-gray-200 text-gray-700 hover:border-brand-blue hover:text-brand-blue shadow-sm"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        {/* User Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                <User className="w-4 h-4 text-brand-blue" /> Personal Info
                            </h3>
                            <div className="grid gap-3">
                                <InfoItem label="First Name" value={ticket.firstName} />
                                <InfoItem label="Email" value={ticket.email} />
                                <InfoItem label="Company" value={ticket.company} />
                                <InfoItem label="Job Title" value={ticket.jobTitle || "N/A"} />
                            </div>
                        </div>

                        {/* Discovery Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                                <AlertCircle className="w-4 h-4 text-brand-blue" /> Discovery
                            </h3>
                            <div className="grid gap-3">
                                <InfoItem label="How Found" value={ticket.howFound} />
                                <InfoItem label="Salesperson" value={ticket.salesperson || "None"} />
                            </div>
                        </div>
                    </div>

                    {/* Needs Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                            <BarChart3 className="w-4 h-4 text-brand-blue" /> Needs & Volume
                        </h3>
                        <div className="bg-blue-50/30 p-5 sm:p-6 rounded-2xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                            <div className="sm:col-span-2">
                                <InfoItem label="Expected Volume" value={`${ticket.pressReleaseVolume} ${ticket.pressPer}`} />
                            </div>
                            <div className="sm:col-span-2 space-y-4">
                                <TextAreaItem label="What are you looking for?" value={ticket.lookingFor} />
                                <TextAreaItem label="How do you measure success?" value={ticket.measureSuccess} />
                                <TextAreaItem label="Other Comments" value={ticket.otherComments} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <Button onClick={onClose} variant="outline" className="w-full sm:w-auto sm:px-8 h-11 flex items-center justify-center font-bold">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value || "—"}</span>
        </div>
    );
}

function TextAreaItem({ label, value }) {
    return (
        <div className="flex flex-col p-4 bg-white rounded-xl border border-gray-150 shadow-sm">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</span>
            <span className="text-sm text-gray-700 leading-relaxed break-words">{value || "No information provided."}</span>
        </div>
    );
}
