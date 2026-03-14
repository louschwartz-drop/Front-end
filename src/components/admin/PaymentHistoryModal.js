"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, DollarSign, CreditCard, ArrowUpRight, 
    Calendar, User, AlertCircle 
} from "lucide-react";
import { adminUserService } from "@/lib/api/admin/users";

export default function PaymentHistoryModal({ isOpen, onClose, userId, userName }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchPaymentHistory();
        }
    }, [isOpen, userId]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const response = await adminUserService.getUserPayments(userId);
            if (response.success) {
                setPayments(response.data);
            }
        } catch (error) {
            console.error("Error fetching payment history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-2xl">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-black text-gray-900 leading-tight">Payment History</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        For {userName || 'User'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading history...</p>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-4 bg-white rounded-full shadow-sm">
                                            <AlertCircle className="w-8 h-8 text-gray-300" />
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">No Transactions Found</h4>
                                    <p className="text-xs text-gray-500 mt-1 px-4">This user hasn't made any purchases yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {payments.map((payment) => (
                                        <motion.div 
                                            key={payment._id} 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 hover:border-blue-100 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 capitalize mb-1">
                                                        <div className="p-1 px-1.5 bg-blue-50 rounded-md">
                                                            <CreditCard className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                                            {payment.planId?.name || "Distribution Plan"}
                                                        </h3>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg">
                                                    {formatAmount(payment.amount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md">
                                                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                                                    {payment.releasesGenerated} Release Credits
                                                </span>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                                                    Success
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
