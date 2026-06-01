"use client";

import { useState, useEffect } from "react";
import { adminEmailService } from "@/lib/api/admin/emails";
import { adminUserService } from "@/lib/api/admin/users";
import { toast } from "react-toastify";
import { Send, Loader2, Users, Mail, Info, FileText, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import RichTextEditor from "@/components/editor/RichTextEditor";

export default function EmailCampaign() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [recipientType, setRecipientType] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [formData, setFormData] = useState({
        subject: "",
        title: "",
        content: "",
        buttonText: "",
        buttonUrl: ""
    });

    useEffect(() => {
        if (recipientType === "specific") {
            setUsers([]);
            setPage(1);
            setHasMore(true);
            fetchUsers(1, "");
        }
    }, [recipientType]);

    useEffect(() => {
        if (recipientType === "specific") {
            const timer = setTimeout(() => {
                setUsers([]);
                setPage(1);
                setHasMore(true);
                fetchUsers(1, search);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [search]);

    const fetchUsers = async (pageNum, searchStr) => {
        try {
            setLoading(true);
            const data = await adminUserService.getAllUsers({
                page: pageNum,
                limit: 20,
                search: searchStr
            });
            const newUsers = data.data.users || data.data || [];
            setUsers(prev => pageNum === 1 ? newUsers : [...prev, ...newUsers]);
            setHasMore(newUsers.length === 20);
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchUsers(nextPage, search);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.content) {
            toast.error("Subject and content are required");
            return;
        }
        if (recipientType === "specific" && selectedUsers.length === 0) {
            toast.error("Please select recipients");
            return;
        }

        try {
            setSending(true);
            if (recipientType === "all") {
                await adminEmailService.sendBulkEmail(formData);
            } else {
                await adminEmailService.sendSpecificEmail({ ...formData, userIds: selectedUsers });
            }
            toast.success("Campaign queued successfully!");
            setFormData({ subject: "", title: "", content: "", buttonText: "", buttonUrl: "" });
            setSelectedUsers([]);
        } catch (error) {
            toast.error(error.message || "Failed to send campaign");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="-m-4 sm:-m-6 lg:-m-8 bg-white min-h-[calc(100vh-64px)] flex flex-col">

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2.5 sm:p-3 bg-blue-50 text-primary rounded-2xl border border-blue-100 shrink-0">
                            <Mail size={24} className="sm:hidden" />
                            <Mail size={32} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">Email Campaign</h1>
                            <p className="text-gray-500 mt-0.5 sm:mt-1 font-medium text-xs sm:text-base truncate">
                                Broadcast premium messages to your user base
                            </p>
                        </div>
                    </div>
                    {/* Desktop publish button */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <Button
                            onClick={handleSend}
                            disabled={sending}
                            className="h-11 lg:h-12 px-6 lg:px-8 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            {sending ? "Queueing..." : "Publish Campaign"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">

                {/* Left: Editor */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100">
                    <div className="max-w-3xl space-y-6 sm:space-y-8">
                        <div className="space-y-4 sm:space-y-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="text-gray-400 shrink-0" size={20} />
                                Content Editor
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Subject Line</label>
                                    <input
                                        type="text"
                                        placeholder="Enter email subject..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-semibold text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Header Title</label>
                                    <input
                                        type="text"
                                        placeholder="Display title in email header..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-semibold text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Message Body</label>
                                    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                                        <RichTextEditor
                                            value={formData.content}
                                            onChange={(html) => setFormData({ ...formData, content: html })}
                                            placeholder="Write your beautiful message here..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Button Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. View Dashboard"
                                        value={formData.buttonText}
                                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Target URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={formData.buttonUrl}
                                        onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Recipients */}
                <div className="w-full lg:w-[380px] xl:w-[420px] bg-gray-50/50 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="space-y-6 sm:space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="text-gray-400 shrink-0" size={20} />
                                Audience
                            </h3>

                            <Select value={recipientType} onValueChange={setRecipientType}>
                                <SelectTrigger className="w-full h-12 sm:h-14 bg-white border-gray-200 rounded-2xl font-bold shadow-sm">
                                    <SelectValue placeholder="Select Recipients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Broadcast to All Users</SelectItem>
                                    <SelectItem value="specific">Targeted Selection</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {recipientType === "specific" && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm font-medium shadow-sm"
                                    />
                                    <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "min(400px, 50vh)" }}>
                                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50 p-2">
                                        {users.map(user => (
                                            <label key={user._id} className="flex items-center gap-3 p-3 hover:bg-blue-50/50 cursor-pointer transition-colors rounded-xl group">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedUsers([...selectedUsers, user._id]);
                                                            else setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                        }}
                                                        className="w-5 h-5 rounded-md text-primary focus:ring-primary border-gray-300 transition-all"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{user.name}</span>
                                                    <span className="text-[11px] text-gray-500 font-medium truncate">{user.email}</span>
                                                </div>
                                            </label>
                                        ))}

                                        {loading && (
                                            <div className="p-8 flex justify-center">
                                                <Loader2 className="animate-spin text-primary" size={24} />
                                            </div>
                                        )}

                                        {hasMore && !loading && (
                                            <button
                                                onClick={loadMore}
                                                className="w-full py-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-blue-50 transition-colors"
                                            >
                                                Load More Users
                                            </button>
                                        )}

                                        {!loading && users.length === 0 && (
                                            <div className="p-8 text-center text-gray-400 text-sm font-medium italic">
                                                No users found matching search
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-100 flex justify-between items-center shrink-0">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                                            {selectedUsers.length} Selected
                                        </span>
                                        <button
                                            onClick={() => setSelectedUsers([])}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 sm:p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Info size={18} className="shrink-0" />
                                <span className="font-bold text-sm">Deployment Info</span>
                            </div>
                            <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                                Campaign will be processed via background workers. You can leave this page once the publication starts.
                            </p>
                        </div>

                        {/* Mobile publish button */}
                        <div className="sm:hidden">
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {sending ? "Queueing..." : "Publish Campaign"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
