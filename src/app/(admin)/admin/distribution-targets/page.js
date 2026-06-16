"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, X, Target } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { distributionTargetService } from "@/lib/api/admin/distributionTargets";

export default function DistributionTargetsPage() {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);
    const [formData, setFormData] = useState({
        totalWebsiteCount: 0,
        expectedWebsiteCount: 0,
    });

    useEffect(() => {
        loadTargets();
    }, []);

    const loadTargets = async () => {
        try {
            const res = await distributionTargetService.getAll();
            if (res.success) {
                setTargets(res.data);
            }
        } catch (error) {
            toast.error("Failed to load distribution targets");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (target) => {
        setEditingTarget(target);
        setFormData({
            totalWebsiteCount: target.totalWebsiteCount || 0,
            expectedWebsiteCount: target.expectedWebsiteCount || 0,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            totalWebsiteCount: Number(formData.totalWebsiteCount),
            expectedWebsiteCount: Number(formData.expectedWebsiteCount),
        };

        try {
            const res = await distributionTargetService.update(editingTarget._id, payload);

            if (res.success) {
                toast.success("Target updated successfully!");
                setIsModalOpen(false);
                loadTargets();
            } else {
                toast.error(res.message || "Operation failed");
            }
        } catch (error) {
            const message = error.response?.data?.message || "An error occurred";
            toast.error(message);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Distribution Targets</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">Manage website counts and expectations for packages.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {targets.map((target) => (
                        <motion.div
                            key={target._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-white rounded-2xl shadow-sm border-2 border-gray-100 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4 gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{target.packageName}</h3>
                                    </div>
                                    <button onClick={() => handleOpenModal(target)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <span className="text-sm font-semibold text-gray-500">Total Website Count</span>
                                        <span className="text-lg font-black text-gray-900">{target.totalWebsiteCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <span className="text-sm font-semibold text-gray-500">Expected Count</span>
                                        <span className="text-lg font-black text-gray-900">{target.expectedWebsiteCount}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {targets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            No distribution targets found. Please seed the database.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && editingTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl my-8 flex flex-col relative max-h-[90vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0 relative z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">Edit Target</h2>
                                        <p className="text-gray-500 text-sm mt-1">Package: <span className="font-bold text-gray-900">{editingTarget.packageName}</span></p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Total Website Count</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.totalWebsiteCount}
                                            onChange={e => setFormData({ ...formData, totalWebsiteCount: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Expected Website Count</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.expectedWebsiteCount}
                                            onChange={e => setFormData({ ...formData, expectedWebsiteCount: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-900"
                                        />
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="pt-4 flex flex-col sm:flex-row gap-3 mt-4">
                                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 rounded-xl h-11 flex items-center justify-center font-bold">Cancel</Button>
                                        <Button type="submit" className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11 flex items-center justify-center shadow-lg shadow-primary/20">
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
