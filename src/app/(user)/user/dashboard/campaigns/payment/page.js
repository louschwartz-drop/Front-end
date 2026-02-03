"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";

import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = userAuthStore();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadCampaign();
    }
  }, [isAuthenticated, params.id]);

  const loadCampaign = async () => {
    try {
      const response = await campaignService.getById(params.id);
      const campaignData = response.data?.campaign || response.data;
      setCampaign(campaignData);

      if (campaignData.status !== "awaiting_payment") {
        toast.warning("This campaign is not ready for payment");
        router.push(`/dashboard/campaigns/${params.id}`);
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);

      const response = await fetch(
        `$/campaigns/${params.id}/payment/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            campaignId: params.id,
          }),
        },
      );

      const data = await response.json();

      if (data.success && data.data?.sessionId) {
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error(error.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Campaign not found</p>
        <Button onClick={() => router.push("/dashboard")} variant="primary">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const packagePrice = campaign.packageId?.price || 99.0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
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
          Back to Campaign
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
        <p className="text-gray-600 mt-2">Secure payment via Stripe</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">
                Campaign #{campaign.campaignId}
              </p>
              <p className="text-sm text-gray-600">
                {campaign.packageId?.name || "Starter Package"}
              </p>
            </div>
            <p className="font-semibold text-gray-900">
              ${packagePrice.toFixed(2)}
            </p>
          </div>

          {campaign.article && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Article Preview
              </h3>
              <p className="text-sm text-gray-700 font-medium mb-1">
                {campaign.article.headline}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {campaign.article.introduction}
              </p>
            </div>
          )}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
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
            <h3 className="font-semibold text-blue-900 mb-1">Secure Payment</h3>
            <p className="text-blue-700 text-sm">
              Your payment is processed securely through Stripe. We never store
              your card information.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
          variant="outline"
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="primary"
          disabled={processing}
          className="flex-1 bg-[#0A5CFF] hover:bg-[#3B82F6]"
        >
          {processing ? "Processing..." : `Pay $${packagePrice.toFixed(2)}`}
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
