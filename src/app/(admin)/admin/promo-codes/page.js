"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, Tag, PlusCircle, Calendar, Percent, DollarSign, Clock, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { promoService } from "@/lib/api/admin/promo";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

// Zod validation schema
const promoSchema = z.object({
    code: z.string()
        .min(3, "Code must be at least 3 characters")
        .regex(/^[A-Z0-9]+$/, "Code must contained only uppercase letters and numbers (no spaces)"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(0, "Value cannot be negative"),
    expiryDate: z.string().min(1, "Expiry date is required").refine((date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    }, "Expiry date cannot be in the past"),
    usageLimit: z.number().nullable(),
    description: z.string().optional(),
    isActive: z.boolean(),
});

export default function PromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [formData, setFormData] = useState({
        code: "",
        discountType: "percentage",
        discountValue: "",
        expiryDate: "",
        usageLimit: "",
        description: "",
        isActive: true
    });

    useEffect(() => {
        loadPromoCodes();
    }, []);

    const loadPromoCodes = async () => {
        try {
            setLoading(true);
            const res = await promoService.getAll();
            if (res.success) setPromoCodes(res.data);
        } catch (error) {
            toast.error("Failed to load promo codes");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (promo = null) => {
        setFormErrors({});
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                code: promo.code,
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : "",
                usageLimit: promo.usageLimit || "",
                description: promo.description || "",
                isActive: promo.isActive
            });
        } else {
            setEditingPromo(null);
            setFormData({
                code: "",
                discountType: "percentage",
                discountValue: "",
                expiryDate: "",
                usageLimit: "",
                description: "",
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const validateForm = () => {
        const dataToValidate = {
            ...formData,
            discountValue: Number(formData.discountValue),
            usageLimit: formData.usageLimit === "" ? null : Number(formData.usageLimit),
        };

        const result = promoSchema.safeParse(dataToValidate);
        if (!result.success) {
            const errors = {};
            result.error.issues.forEach((issue) => {
                errors[issue.path[0]] = issue.message;
            });
            setFormErrors(errors);
            return null;
        }
        setFormErrors({});
        return result.data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validatedData = validateForm();
        if (!validatedData) return;

        try {
            let res;
            if (editingPromo) {
                res = await promoService.update(editingPromo._id, validatedData);
            } else {
                res = await promoService.create(validatedData);
            }

            if (res.success) {
                toast.success(editingPromo ? "Promo code updated!" : "Promo code created!");
                setIsModalOpen(false);
                loadPromoCodes();
            } else {
                toast.error(res.message || "Operation failed");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this promo code?")) return;
        try {
            const res = await promoService.delete(id);
            if (res.success) {
                toast.success("Promo code deleted");
                loadPromoCodes();
            }
        } catch (error) {
            toast.error("Failed to delete promo code");
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await promoService.toggleStatus(id);
            if (res.success) {
                toast.success(res.message);
                loadPromoCodes();
            }
        } catch (error) {
            toast.error("Failed to toggle status");
        }
    };

    const handleCodeChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/\s/g, "");
        setFormData({ ...formData, code: val });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
                    <p className="text-gray-500">Create and manage discounts for your users.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Add New Promo
                </Button>
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
                    {promoCodes.map((promo) => (
                        <motion.div
                            key={promo._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${promo.isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/10'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${promo.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{promo.code}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(promo)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(promo._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-primary">
                                        {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                                    </span>
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">OFF</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded-lg">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span>Exp: {new Date(promo.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded-lg">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span>Used: {promo.usedCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}</span>
                                    </div>
                                </div>

                                {promo.description && (
                                    <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-2">"{promo.description}"</p>
                                )}

                                <div className="pt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${promo.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${promo.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {promo.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus(promo._id)}
                                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${promo.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    >
                                        {promo.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {promoCodes.length === 0 && !loading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Tag className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No promo codes found. Create your first one!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl my-8 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                            
                            <div className="flex justify-between items-center mb-6 relative">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">{editingPromo ? "Edit Promo Code" : "New Promo Code"}</h2>
                                    <p className="text-gray-500 text-xs">Configure your discount settings below.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 relative">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Coupon Code</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={handleCodeChange}
                                            className={`w-full pl-10 p-2.5 bg-gray-50 border ${formErrors.code ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-lg outline-none transition-all font-bold text-gray-900 uppercase`}
                                            placeholder="SUMMER20"
                                        />
                                    </div>
                                    {formErrors.code && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.code}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Discount Type</label>
                                        <Select
                                            value={formData.discountType}
                                            onValueChange={(val) => setFormData({ ...formData, discountType: val })}
                                        >
                                            <SelectTrigger className="rounded-lg">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Price ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Discount Value</label>
                                        <div className="relative">
                                            {formData.discountType === 'percentage' ? (
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            ) : (
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            )}
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.discountValue}
                                                onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                                className={`w-full pl-10 p-2.5 bg-gray-50 border ${formErrors.discountValue ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-lg outline-none transition-all font-bold text-gray-900`}
                                                placeholder={formData.discountType === 'percentage' ? "20" : "50"}
                                            />
                                        </div>
                                        {formErrors.discountValue && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.discountValue}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Expiry Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={formData.expiryDate}
                                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                                className={`w-full pl-10 p-2.5 bg-gray-50 border ${formErrors.expiryDate ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-lg outline-none transition-all font-bold text-gray-900`}
                                            />
                                        </div>
                                        {formErrors.expiryDate && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.expiryDate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Total Usage Limit</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-900"
                                            placeholder="e.g. 100"
                                        />
                                        <p className="text-[9px] text-gray-400 mt-1 ml-1">Enter how many people will use it. (Leave empty for unlimited)</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Internal Notes (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none h-20 transition-all resize-none font-medium text-gray-600 text-sm"
                                        placeholder="Add private notes about this promo..."
                                    />
                                    <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                                        <Info className="w-3 h-3 text-gray-400" />
                                        <p className="text-[9px] text-gray-400">Internal only and will not be shown to customers.</p>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg">Cancel</Button>
                                    <Button type="submit" className="flex-1 font-black rounded-lg shadow-lg shadow-primary/20">
                                        {editingPromo ? "Save Changes" : "Create Code"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
