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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pricing Plans</h1>
                    <p className="text-gray-500">Manage packages available for users.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupNames.map((planName) => {
                        const variants = [...(plansByGroup[planName] || [])].sort((a, b) => a.releasesCount - b.releasesCount);
                        const selected = getSelectedVariant(planName);
                        if (!selected) return null;
                        return (
                            <motion.div
                                key={planName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 bg-white rounded-xl shadow-sm border-2 ${selected.isActive ? 'border-gray-100' : 'border-red-100 opacity-75'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-gray-900">{planName}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(selected)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(selected._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    {variants.map((v) => (
                                        <button
                                            key={v._id}
                                            type="button"
                                            onClick={() => setSelectedVariant(planName, v)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selected._id === v._id
                                                ? "bg-primary text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            {v.releasesCount} {v.releasesCount === 1 ? "Article" : "Articles"}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-black text-primary">${selected.price}</p>
                                        <span className="text-xs text-gray-400">/ {selected.releasesCount} Articles</span>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {selected.isPopular && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">MOST POPULAR</span>
                                    )}
                                    {!selected.isActive && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded ml-2">INACTIVE</span>
                                    )}
                                    {selected.isComingSoon && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded ml-2">COMING SOON</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{selected.description}</p>
                                <ul className="space-y-2">
                                    {(selected.features || []).slice(0, 3).map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                            <Check className="w-3 h-3 text-green-500" /> {f}
                                        </li>
                                    ))}
                                    {selected.features?.length > 3 && (
                                        <li className="text-xs text-gray-400">+{selected.features.length - 3} more features</li>
                                    )}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Plan Name</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={!!editingPlan}
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full p-2.5 border rounded-xl outline-none transition-all ${editingPlan ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary"}`}
                                                placeholder="e.g. Starter"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Price ($)</label>
                                            <input
                                                type="number" required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                placeholder="49"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Article Releases Included</label>
                                        <select
                                            required
                                            disabled={!!editingPlan}
                                            value={formData.releasesCount}
                                            onChange={e => setFormData({ ...formData, releasesCount: Number(e.target.value) })}
                                            className={`w-full p-2.5 border rounded-xl outline-none transition-all ${editingPlan ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary"}`}
                                        >
                                            <option value={1}>1</option>
                                            <option value={3}>3</option>
                                            <option value={5}>5</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1">Number of press releases allowed in this plan.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none h-20 transition-all resize-none"
                                            placeholder="Describe what this plan offers..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Features</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={featureInput}
                                                onChange={e => setFeatureInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                placeholder="Add a feature..."
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeature}
                                                className="w-full sm:w-auto px-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 border border-gray-200 rounded-xl">
                                            {formData.features.map((feature, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 text-xs font-medium text-gray-700 rounded-lg shadow-sm"
                                                >
                                                    {feature}
                                                    <X
                                                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                        onClick={() => removeFeature(feature)}
                                                    />
                                                </span>
                                            ))}
                                            {formData.features.length === 0 && (
                                                <p className="text-xs text-gray-400 italic">No features added yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPopular}
                                                onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Most Popular</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Active</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isComingSoon}
                                                onChange={e => setFormData({ ...formData, isComingSoon: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Coming Soon</span>
                                        </label>
                                    </div>

                                    <div className="pt-4 flex gap-3 pb-2">
                                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                                        <Button type="submit" className="flex-1 font-bold">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
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
