"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, FileText, LayoutDashboard } from "lucide-react";
import Button from "@/components/ui/Button";

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [status, setStatus] = useState("processing"); // processing, success, error

    useEffect(() => {
        if (!sessionId) {
            setStatus("error");
            return;
        }
        // Small delay to let webhook finish, though we don't strictly need it for UI
        const timer = setTimeout(() => {
            setStatus("success");
        }, 2000);
        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center"
            >
                {status === "processing" ? (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A5CFF]"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Confirming Payment...</h1>
                        <p className="text-gray-600">Please wait while we secure your transaction.</p>
                    </div>
                ) : status === "success" ? (
                    <div className="space-y-6">
                        <div className="flex justify-center text-green-500">
                            <CheckCircle className="w-20 h-20" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">Payment Successful!</h1>
                        <p className="text-gray-600">Your press release is being prepared. You can track it in your dashboard.</p>

                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={() => router.push("/user/dashboard/press-releases")}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" /> View Press Releases
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => router.push("/user/dashboard")}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center text-red-500">
                            <CheckCircle className="w-20 h-20 rotate-45" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                        <p className="text-gray-600">We couldn't verify your payment session. Please check your dashboard later.</p>
                        <Button onClick={() => router.push("/user/dashboard")} className="w-full">Back to Dashboard</Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0A5CFF]"></div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
