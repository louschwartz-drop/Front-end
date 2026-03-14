"use client";

import { X, Clock, User, Mail, Building, Briefcase, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-blue/10 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-brand-blue" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{ticket.ticketId}</h2>
                            <p className="text-sm text-gray-500">Submitted on {new Date(ticket.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status Section */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[ticket.status]}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {["Pending", "In Progress", "Completed", "Rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => onUpdateStatus(status)}
                                    disabled={loading || ticket.status === status}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ticket.status === status
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white border border-gray-200 text-gray-700 hover:border-brand-blue hover:text-brand-blue shadow-sm"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* User Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4" /> Personal Info
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
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Discovery
                            </h3>
                            <div className="grid gap-3">
                                <InfoItem label="How Found" value={ticket.howFound} />
                                <InfoItem label="Salesperson" value={ticket.salesperson || "None"} />
                            </div>
                        </div>
                    </div>

                    {/* Needs Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Needs & Volume
                        </h3>
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 grid md:grid-cols-2 gap-6">
                            <InfoItem label="Expected Volume" value={`${ticket.pressReleaseVolume} ${ticket.pressPer}`} />
                            <div className="md:col-span-2 space-y-4">
                                <TextAreaItem label="What are you looking for?" value={ticket.lookingFor} />
                                <TextAreaItem label="How do you measure success?" value={ticket.measureSuccess} />
                                <TextAreaItem label="Other Comments" value={ticket.otherComments} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <Button onClick={onClose} variant="outline" className="px-8">
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
            <span className="text-xs font-semibold text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}

function TextAreaItem({ label, value }) {
    return (
        <div className="flex flex-col p-4 bg-white rounded-xl border border-gray-100">
            <span className="text-xs font-semibold text-gray-400 mb-1">{label}</span>
            <span className="text-sm text-gray-700 leading-relaxed">{value || "No information provided."}</span>
        </div>
    );
}

// Re-using BarChart3 from lucide-react (adding to imports above)
import { BarChart3 } from "lucide-react";
