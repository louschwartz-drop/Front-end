"use client";

import { useState, useEffect } from "react";
import { getSystemLogs, deleteSystemLogs, resolveSystemLog } from "@/lib/api/admin/logs";
import { toast } from "react-toastify";
import Pagination from "@/components/ui/Pagination";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Bug } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

export default function SystemLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [moduleFilter, setModuleFilter] = useState("ALL");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    
    // Modal state
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [severityFilter, moduleFilter, fromDateFilter, toDateFilter, currentPage]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await getSystemLogs({
                page: currentPage,
                limit: 10,
                severity: severityFilter,
                moduleName: moduleFilter,
                startDate: fromDateFilter,
                endDate: toDateFilter
            });
            if (response && response.success) {
                setLogs(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalResults(response.pagination.total);
                }
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to load system logs");
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSeverityFilter("ALL");
        setModuleFilter("ALL");
        setFromDateFilter("");
        setToDateFilter("");
        setCurrentPage(1);
    };

    const handleResolve = async (id) => {
        try {
            await resolveSystemLog(id);
            toast.success("Log marked as resolved");
            fetchLogs();
        } catch (error) {
            toast.error("Failed to resolve log");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            await deleteSystemLogs([id]);
            toast.success("Log deleted");
            fetchLogs();
        } catch (error) {
            toast.error("Failed to delete log");
        }
    };

    const openModal = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'INFO':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-600"><Info className="w-3 h-3" /> INFO</span>;
            case 'WARNING':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-yellow-50 text-yellow-600"><AlertTriangle className="w-3 h-3" /> WARNING</span>;
            case 'ERROR':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-orange-50 text-orange-600"><AlertCircle className="w-3 h-3" /> ERROR</span>;
            case 'CRITICAL':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-red-100 text-red-700"><Bug className="w-3 h-3" /> CRITICAL</span>;
            case 'CRASH':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md bg-red-600 text-white"><AlertTriangle className="w-3 h-3" /> CRASH</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">{severity}</span>;
        }
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Logs & Errors</h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                    Monitor system health, view worker failures, and track API errors seamlessly.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
                
                {/* Severity Filter */}
                <div className="w-[180px]">
                    <Select
                        value={severityFilter}
                        onValueChange={(value) => { setSeverityFilter(value); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="All Severities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Severities</SelectItem>
                            <SelectItem value="INFO">INFO</SelectItem>
                            <SelectItem value="WARNING">WARNING</SelectItem>
                            <SelectItem value="ERROR">ERROR</SelectItem>
                            <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                            <SelectItem value="CRASH">CRASH</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Module Filter */}
                <div className="w-[200px]">
                    <Select
                        value={moduleFilter}
                        onValueChange={(value) => { setModuleFilter(value); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="All Modules" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Modules</SelectItem>
                            <SelectItem value="Media Worker">Media Worker</SelectItem>
                            <SelectItem value="Email Worker">Email Worker</SelectItem>
                            <SelectItem value="Express Route">Express Route</SelectItem>
                            <SelectItem value="Global Server">Global Server</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">From</label>
                        <input
                            type="date"
                            value={fromDateFilter}
                            onChange={(e) => { setFromDateFilter(e.target.value); setCurrentPage(1); }}
                            className="text-xs font-bold bg-transparent outline-none w-32 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-2 border-l border-gray-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">To</label>
                        <input
                            type="date"
                            value={toDateFilter}
                            onChange={(e) => { setToDateFilter(e.target.value); setCurrentPage(1); }}
                            className="text-xs font-bold bg-transparent outline-none w-32 cursor-pointer"
                        />
                    </div>
                </div>

                {(severityFilter !== "ALL" || moduleFilter !== "ALL" || fromDateFilter !== "" || toDateFilter !== "") && (
                    <button
                        onClick={clearFilters}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No system logs found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                    <th className="px-4 py-4 font-semibold">Severity</th>
                                    <th className="px-4 py-4 font-semibold">Module</th>
                                    <th className="px-4 py-4 font-semibold">Message</th>
                                    <th className="px-4 py-4 font-semibold text-center">Status</th>
                                    <th className="px-4 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            {getSeverityBadge(log.severity)}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            {log.moduleName}
                                        </td>
                                        <td className="px-4 py-4 truncate max-w-xs" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {log.isResolved ? (
                                                <span className="inline-flex items-center text-xs font-bold text-green-600"><CheckCircle className="w-4 h-4 mr-1"/> Resolved</span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-bold text-orange-500">Open</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(log)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-primary bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                {!log.isResolved && (
                                                    <button
                                                        onClick={() => handleResolve(log._id)}
                                                        className="px-3 py-1.5 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(log._id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalResults={totalResults}
                itemsPerPage={10}
                className="mt-4"
            />

            {/* Log Details Modal */}
            {isModalOpen && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Error Details</h2>
                                <p className="text-sm text-gray-500 mt-1">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            <div className="mb-6 flex gap-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Module</span>
                                    <p className="font-semibold text-gray-900">{selectedLog.moduleName}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Severity</span>
                                    <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <span className="text-xs font-bold text-gray-400 uppercase">Message</span>
                                <p className="text-gray-800 font-medium bg-white p-3 border border-gray-200 rounded-lg mt-1">{selectedLog.message}</p>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Full Details / Stack Trace</span>
                                <div className="mt-1 bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-green-400 font-mono">
                                    <pre className="whitespace-pre-wrap">
                                        {typeof selectedLog.details === 'object' 
                                            ? JSON.stringify(selectedLog.details, null, 2) 
                                            : selectedLog.details || "No details provided."}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
