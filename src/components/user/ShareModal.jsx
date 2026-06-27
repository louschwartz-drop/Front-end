import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "react-toastify";
import Tooltip from "@/components/ui/Tooltip";

export default function ShareModal({ isOpen, onClose, shareUrl, onGenerateNewLink, isGenerating }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-6 sm:max-w-md">
                <DialogHeader className="mb-4">
                    <DialogTitle>Share Campaign</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col gap-6 pt-2">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Anyone with this link will be able to view a read-only preview of this campaign and claim it into their own workspace to edit and publish.
                    </p>

                    {/* Link Box */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 flex items-center">
                        <div className="flex-1 px-3 py-2 text-sm text-gray-700 font-medium truncate overflow-hidden bg-transparent">
                            {shareUrl || "Generating..."}
                        </div>
                        <button
                            onClick={handleCopy}
                            disabled={!shareUrl}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold text-gray-700 shrink-0"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    {/* Generate New Link Button */}
                    <div className="pt-4 border-t border-gray-100 mt-2">
                        <Tooltip text="Generating a new link will instantly revoke access for anyone using the previous link." position="top">
                            <button
                                onClick={onGenerateNewLink}
                                disabled={isGenerating}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-xl font-semibold text-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                Generate New Link
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
