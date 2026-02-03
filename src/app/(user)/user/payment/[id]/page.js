"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import Button from "@/components/ui/Button";

const pricingPlans = {
  starter: { name: "Starter", price: 49 },
  professional: { name: "Professional", price: 149 },
  enterprise: { name: "Enterprise", price: 399 },
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params.id;
  const planId = searchParams.get("plan") || "professional";
  const isAuthenticated = true;
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isMockCampaign = campaignId?.startsWith("mock-");

  useEffect(() => {
    if (campaignId && !isMockCampaign) {
      loadCampaign();
    } else {
      setLoading(false);
    }
  }, [campaignId, isAuthenticated, router, planId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);

      response = {};
    } catch (error) {
      console.error("Error loading campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (isMockCampaign) {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        alert("Payment successful! (Demo Mode)");
        router.push("/user/dashboard");
      }, 2000);
      return;
    }

    try {
      setProcessing(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const response = await fetch(`${apiUrl}/user/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          campaignId: campaignId,
          packageId: planId,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      alert(error.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const selectedPlan = pricingPlans[planId] || pricingPlans.professional;
  const packagePrice = selectedPlan.price;

  return (
    <div className="min-h-screen  flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 container  "
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => router.push(`/user/pricing/${campaignId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Pricing
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600 mb-6">Secure payment via Stripe</p>
          {isMockCampaign && (
            <div className="mb-4 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full inline-block">
              Demo Mode
            </div>
          )}

          <div className="space-y-6 mb-6">
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedPlan.name} Plan
                </p>
                <p className="text-sm text-gray-600">
                  Article distribution package
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                ${packagePrice.toFixed(2)}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ${packagePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-semibold text-gray-900">$0.00</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-[#0A5CFF]">
                  ${packagePrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1 text-sm">
                  Secure Payment
                </h3>
                <p className="text-blue-700 text-xs">
                  Your payment is processed securely through Stripe. We never
                  store your card information.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handlePayment}
                variant="primary"
                disabled={processing}
                className="bg-[#0A5CFF] hover:bg-[#3B82F6] w-full"
                fullWidth
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Processing...
                  </span>
                ) : (
                  `Pay $${packagePrice.toFixed(2)}`
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-500"
        >
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}
