"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { campaignService } from "@/lib/api/user/campaigns";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

function ClaimProcessor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            // Should not happen if they just logged in, but just in case
            toast.error("You must be logged in to claim this campaign.");
            router.push("/user/auth");
            return;
        }

        const claimAndRedirect = async () => {
            try {
                const campaignId = searchParams.get("campaignId");
                const token = searchParams.get("token");
                const action = searchParams.get("action"); // 'edit' or 'publish'

                if (!campaignId || !token) {
                    toast.error("Invalid claim link.");
                    router.push("/user/dashboard/press-releases");
                    return;
                }

                // Call the API to clone
                const response = await campaignService.claimCampaign(campaignId, token);
                
                if (response.success && response.data?.clonedCampaignId) {
                    toast.success("Campaign claimed successfully!");
                    
                    const cloneId = response.data.clonedCampaignId;

                    if (action === "publish") {
                        router.push(`/user/pricing/${cloneId}`);
                    } else {
                        // Default to edit
                        router.push(`/user/edit/${cloneId}`);
                    }
                } else {
                    toast.error(response.message || "Failed to claim campaign.");
                    router.push("/user/dashboard/press-releases");
                }
            } catch (error) {
                console.error("Claim error:", error);
                toast.error(error?.response?.data?.message || "An error occurred while claiming the campaign.");
                router.push("/user/dashboard/press-releases");
            } finally {
                setIsProcessing(false);
            }
        };

        claimAndRedirect();
    }, [status, searchParams, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Preparing your Campaign</h1>
                <p className="text-slate-500">Please wait while we set up your personalized draft. You will be redirected shortly.</p>
            </div>
        </div>
    );
}

export default function SharedClaimPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <ClaimProcessor />
        </Suspense>
    );
}
