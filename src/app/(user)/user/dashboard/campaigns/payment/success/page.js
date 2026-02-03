"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";
import Button from "@/components/ui/Button";

function PaymentSuccessContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAuthenticated } = userAuthStore();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated && searchParams.get("session_id")) {
      verifyPayment();
    }
  }, [isAuthenticated, searchParams]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(
        `${env.apiUrl}/campaigns/${params.id}/payment/verify`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );

      const data = await response.json();
      if (data.success && data.data?.paid) {
        setSuccess(true);
      } else {
        setSuccess(false);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setSuccess(false);
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      {success ? (
        <>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment has been processed successfully. Your campaign will now
            be distributed.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
              variant="primary"
              className="bg-[#0A5CFF] hover:bg-[#3B82F6]"
            >
              View Campaign
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Verification Failed
          </h1>
          <p className="text-gray-600 mb-8">
            We couldn't verify your payment. Please contact support if you were
            charged.
          </p>
          <Button
            onClick={() =>
              router.push(`/dashboard/campaigns/${params.id}/payment`)
            }
            variant="primary"
            className="bg-[#0A5CFF] hover:bg-[#3B82F6]"
          >
            Try Again
          </Button>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
