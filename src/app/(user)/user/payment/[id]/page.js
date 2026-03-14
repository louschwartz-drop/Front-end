"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/user/CheckoutForm";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

import { pricingService } from "@/lib/api/user/pricing";
import { paymentService } from "@/lib/api/user/payments";
import userAuthStore from "@/store/userAuthStore";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params.id;
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [clientSecret, setClientSecret] = useState("");

  const { user } = userAuthStore();
  const userId = user?._id || user?.id;

  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {

    if (!planId) {
      router.push(`/user/pricing/${campaignId}`);
      return;
    }
    loadPlan();
  }, [campaignId, planId, userId, saveCard]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await pricingService.getPlan(planId);
      if (res.success) {
        setPlan(res.data);
        // Pre-create payment intent when plan is loaded
        const piRes = await paymentService.createPaymentIntent(campaignId, planId, userId, saveCard);
        if (piRes.success) {
          setClientSecret(piRes.data.clientSecret);
        } else {
          toast.error(piRes.message || "Failed to initialize payment");
        }
      } else {
        toast.error("Failed to load plan details");
      }
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    toast.success("Payment successful! Redirecting to your press releases...");

    // Refresh user data to update available releases count in sidebar
    await userAuthStore.getState().refreshUser();

    setTimeout(() => {
      router.push("/user/dashboard/press-releases");
    }, 1500);
  };

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0A5CFF',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-1 w-16 h-1 bg-primary rounded-full blur-xl"
          />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">Loading Secure Checkout</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;
  console.log("Stripe Key:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return (
    <div className="min-h-screen flex flex-col items-center  ">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Summary */}
        <div className="lg:col-span-5 space-y-6">
          <button
            onClick={() => router.push(`/user/pricing/${campaignId}`)}
            className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-all font-medium mb-4"
          >
            <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Back to Pricing
          </button>

          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100/50 p-2 sm:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Order Summary</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md sm:text-2xl font-black text-gray-900 leading-tight">
                    {plan.name} Package
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{plan.releasesCount} Press Release{plan.releasesCount > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-md sm:text-2xl font-black text-primary">${plan.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2.5">
                {plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-100">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>${plan.price.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-dashed border-gray-100">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <div className="text-right">
                  <div className="text-md sm:text-3xl font-black text-primary leading-none">${plan.price.toFixed(2)}</div>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">One-time payment</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-2 sm:p-6 border border-primary/10">
            <div className="flex gap-4">
              <div className="p-2 sm:p-3 max-h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Secure Stripe Payment</h4>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Your data is encrypted and secure. We do not store your full card details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stripe Component */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.06)] border border-gray-100/50 p-4 sm:p-8 h-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-lg sm:text-3xl font-black text-gray-900">Payment Details</h1>
              <p className="text-gray-500 mt-2 font-medium text-sm sm:text-base">Enter your card information below to proceed.</p>
            </div>

            <div className="flex-1">
              {clientSecret ? (
                <Elements
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#0A5CFF',
                        colorBackground: '#ffffff',
                        colorText: '#101828',
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        borderRadius: '16px',
                      },
                      rules: {
                        '.Input': {
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }
                      }
                    },
                    paymentMethodCreation: 'manual',
                    // This explicitly disables Link in the Elements instance
                    link: {
                      mode: 'never'
                    }
                  }}
                  stripe={stripePromise}
                >
                  <CheckoutForm
                    amount={plan.price}
                    campaignId={campaignId}
                    onSuccess={handlePaymentSuccess}
                    saveCard={saveCard}
                    setSaveCard={setSaveCard}
                    userEmail={user?.email}
                  />
                </Elements>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(10,92,255,0.5)]"
                  />
                  <p className="text-gray-400 font-bold mt-6 uppercase tracking-widest text-[10px]">Verifying Transaction...</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-6 opacity-30 grayscale contrast-125">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-6" alt="Stripe" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
