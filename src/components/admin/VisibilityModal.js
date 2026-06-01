import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Eye, EyeOff, User } from "lucide-react";
import Button from "@/components/ui/Button";

export default function VisibilityModal({ isOpen, onClose, onUpdate, currentOverride }) {
    const [selected, setSelected] = useState(currentOverride);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSelected(currentOverride);
    }, [currentOverride, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdate(selected);
        setIsSaving(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-gray-900">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-lg">Admin Visibility Override</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-6">
                            Control whether this press release appears in the public Newsroom. Admin overrides take precedence over the user's preference.
                        </p>

                        <div className="space-y-3">
                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === null ? 'border-primary bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                <div className="flex h-6 items-center">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={selected === null}
                                        onChange={() => setSelected(null)}
                                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-bold text-gray-900 text-sm">Use User Preference</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Rely on the user's toggle setting. If the user hides it, it will be hidden. If they show it, it will be visible.
                                    </p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === true ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                <div className="flex h-6 items-center">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={selected === true}
                                        onChange={() => setSelected(true)}
                                        className="h-4 w-4 border-emerald-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Eye className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-gray-900 text-sm">Force Show (Visible)</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Force this press release to be publicly visible in the Newsroom, overriding the user's settings.
                                    </p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === false ? 'border-rose-500 bg-rose-50/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                <div className="flex h-6 items-center">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={selected === false}
                                        onChange={() => setSelected(false)}
                                        className="h-4 w-4 border-rose-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <EyeOff className="w-4 h-4 text-rose-600" />
                                        <span className="font-bold text-gray-900 text-sm">Force Hide (Hidden)</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Force this press release to be hidden from the Newsroom, even if the user wants it visible.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            className="px-6 py-2"
                        >
                            Save Changes
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
