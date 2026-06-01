"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, Shield, PlusCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { pricingService } from "@/lib/api/admin/pricing";

export default function PricingManagementPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        releasesCount: "",
        description: "",
        features: [],
        isPopular: false,
        isActive: true,
        isComingSoon: false
    });
    const [featureInput, setFeatureInput] = useState("");
    const [selectedVariantByPlan, setSelectedVariantByPlan] = useState({});

    useEffect(() => {
        loadPlans();
    }, []);

    const plansByGroup = plans.reduce((acc, plan) => {
        const name = plan.name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(plan);
        return acc;
    }, {});
    const groupNames = Object.keys(plansByGroup);

    const getSelectedVariant = (planName) => {
        const variants = plansByGroup[planName] || [];
        const storedId = selectedVariantByPlan[planName];
        const found = variants.find((p) => p._id === storedId);
        return found || variants[0] || null;
    };

    const setSelectedVariant = (planName, plan) => {
        setSelectedVariantByPlan((prev) => ({ ...prev, [planName]: plan._id }));
    };

    const loadPlans = async () => {
        try {
            const res = await pricingService.getAll();
            if (res.success) setPlans(res.data);
        } catch (error) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            const rc = plan.releasesCount;
            setFormData({
                name: plan.name,
                price: plan.price,
                releasesCount: [1, 3, 5].includes(rc) ? rc : 1,
                description: plan.description || "",
                features: plan.features || [],
                isPopular: plan.isPopular,
                isActive: plan.isActive,
                isComingSoon: plan.isComingSoon || false
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                price: "",
                releasesCount: 1,
                description: "",
                features: [],
                isPopular: false,
                isActive: true,
                isComingSoon: false
            });
        }
        setFeatureInput("");
        setIsModalOpen(true);
    };

    const addFeature = () => {
        if (!featureInput.trim()) return;
        if (formData.features.includes(featureInput.trim())) {
            toast.warning("Feature already exists");
            return;
        }
        setFormData({
            ...formData,
            features: [...formData.features, featureInput.trim()]
        });
        setFeatureInput("");
    };

    const removeFeature = (feature) => {
        setFormData({
            ...formData,
            features: formData.features.filter(f => f !== feature)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            releasesCount: Number(formData.releasesCount)
        };

        try {
            let res;
            if (editingPlan) {
                res = await pricingService.update(editingPlan._id, payload);
            } else {
                res = await pricingService.create(payload);
            }

            if (res.success) {
                toast.success(editingPlan ? "Plan updated!" : "Plan created!");
                setIsModalOpen(false);
                loadPlans();
            } else {
                toast.error(res.message || "Operation failed");
            }
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || "An error occurred";
            toast.error(message);
            if (!editingPlan && status === 409) {
                return;
            }
            if (editingPlan || status !== 409) {
                setIsModalOpen(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            const res = await pricingService.delete(id);
            if (res.success) {
                toast.success("Plan deleted");
                loadPlans();
            }
        } catch (error) {
            toast.error("Failed to delete plan");
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pricing Plans</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">Manage packages available for users.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-5 rounded-xl shadow-lg">
                    <PlusCircle className="w-4 h-4" /> Add New Plan
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupNames.map((planName) => {
                        const variants = [...(plansByGroup[planName] || [])].sort((a, b) => a.releasesCount - b.releasesCount);
                        const selected = getSelectedVariant(planName);
                        if (!selected) return null;
                        return (
                            <motion.div
                                key={planName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 bg-white rounded-2xl shadow-sm border-2 transition-all flex flex-col justify-between ${selected.isActive ? 'border-gray-100' : 'border-red-100 opacity-75'}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight truncate">{planName}</h3>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => handleOpenModal(selected)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(selected._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Plan Variants Switcher */}
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                                        {variants.map((v) => (
                                            <button
                                                key={v._id}
                                                type="button"
                                                onClick={() => setSelectedVariant(planName, v)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selected._id === v._id
                                                    ? "bg-primary text-white shadow-sm"
                                                    : "bg-gray-50 border border-gray-150 text-gray-600 hover:bg-gray-100"
                                                    }`}
                                            >
                                                {v.releasesCount} {v.releasesCount === 1 ? "Article" : "Articles"}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-2xl font-black text-primary">${selected.price}</p>
                                            <span className="text-xs text-gray-400 font-medium">/ {selected.releasesCount} Articles</span>
                                        </div>
                                    </div>

                                    {/* Badges Panel */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {selected.isPopular && (
                                            <span className="px-2.5 py-0.5 bg-yellow-100 border border-yellow-200 text-yellow-750 text-[10px] font-black uppercase rounded tracking-wider">MOST POPULAR</span>
                                        )}
                                        {!selected.isActive && (
                                            <span className="px-2.5 py-0.5 bg-red-150 border border-red-200 text-red-750 text-[10px] font-black uppercase rounded tracking-wider">INACTIVE</span>
                                        )}
                                        {selected.isComingSoon && (
                                            <span className="px-2.5 py-0.5 bg-purple-100 border border-purple-200 text-purple-750 text-[10px] font-black uppercase rounded tracking-wider">COMING SOON</span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">{selected.description}</p>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <ul className="space-y-2">
                                        {(selected.features || []).slice(0, 3).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-gray-500 font-medium">
                                                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> 
                                                <span className="break-words">{f}</span>
                                            </li>
                                        ))}
                                        {selected.features?.length > 3 && (
                                            <li className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-5">
                                                +{selected.features.length - 3} more features
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
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
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8 flex flex-col relative max-h-[90vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0 relative z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
                                        <p className="text-gray-500 text-xs">Configure your pricing options below.</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                                <form onSubmit={handleSubmit} className="space-y-5 relative">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Plan Name</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={!!editingPlan}
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full p-2.5 border rounded-xl outline-none transition-all font-bold text-gray-900 ${editingPlan ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : "bg-gray-50 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                                                placeholder="e.g. Starter"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Price ($)</label>
                                            <input
                                                type="number" 
                                                required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-900"
                                                placeholder="49"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Article Releases Included</label>
                                        <select
                                            required
                                            disabled={!!editingPlan}
                                            value={formData.releasesCount}
                                            onChange={e => setFormData({ ...formData, releasesCount: Number(e.target.value) })}
                                            className={`w-full p-2.5 border rounded-xl outline-none transition-all font-bold text-gray-900 ${editingPlan ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : "bg-gray-50 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                                        >
                                            <option value={1}>1</option>
                                            <option value={3}>3</option>
                                            <option value={5}>5</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1 leading-tight">Number of press releases allowed in this plan.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none h-20 transition-all resize-none font-medium text-gray-600 text-sm"
                                            placeholder="Describe what this plan offers..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Features</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={featureInput}
                                                onChange={e => setFeatureInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-800"
                                                placeholder="Add a feature..."
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeature}
                                                className="w-full sm:w-auto px-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold h-11 flex items-center justify-center"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 border border-gray-200 rounded-xl">
                                            {formData.features.map((feature, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-150 text-xs font-bold text-gray-700 rounded-lg shadow-sm"
                                                >
                                                    <span className="truncate max-w-[150px]">{feature}</span>
                                                    <X
                                                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-500 flex-shrink-0"
                                                        onClick={() => removeFeature(feature)}
                                                    />
                                                </span>
                                            ))}
                                            {formData.features.length === 0 && (
                                                <p className="text-xs text-gray-400 italic p-1">No features added yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPopular}
                                                onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Most Popular</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Active</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isComingSoon}
                                                onChange={e => setFormData({ ...formData, isComingSoon: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Coming Soon</span>
                                        </label>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="pt-4 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white z-10 border-t border-gray-100 pt-4 mt-2">
                                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 rounded-xl h-11 flex items-center justify-center font-bold">Cancel</Button>
                                        <Button type="submit" className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11 flex items-center justify-center shadow-lg shadow-primary/20">
                                            {editingPlan ? "Update Plan" : "Create Plan"}
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
