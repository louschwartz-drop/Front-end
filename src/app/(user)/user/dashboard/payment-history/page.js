"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";
import Button from "@/components/ui/Button";
import PaymentHistoryTable from "@/components/user/PaymentHistoryTable";

function PaymentHistoryContent() {
    const router = useRouter();
    const { user } = userAuthStore();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Simulating data fetch - replace with actual API call
    const loadPayments = async () => {
        try {
            setLoading(true);
            // const response = await api.get("/user/payments");
            // const paymentsData = response.data?.payments || [];
            const paymentsData = []; // Placeholder until API is connected
            setPayments(paymentsData);
        } catch (error) {
            console.error("Error loading payments:", error);
        } finally {
            setLoading(false);
        }
    };

    // Trigger load on mount - commented out until API is ready or use mock data
    /*
    useEffect(() => {
      loadPayments();
    }, []);
    */

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        View and manage your payment history for all campaigns
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/user/dashboard/campaigns")}
                    variant="primary"
                    className="bg-primary hover:bg-brand-blue shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        View Campaigns
                    </div>
                </Button>
            </div>

            <PaymentHistoryTable payments={payments} />
        </div>
    );
}

export default function PaymentHistoryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading payment history...</p>
                    </div>
                </div>
            }
        >
            <PaymentHistoryContent />
        </Suspense>
    );
}