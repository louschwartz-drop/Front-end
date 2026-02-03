"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import userAuthStore from "@/store/userAuthStore";
import Button from "@/components/ui/Button";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    features: [
      "Distribution to 5 media outlets",
      "Basic SEO optimization",
      "Social media sharing",
      "Email support",
    ],
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    features: [
      "Distribution to 25 media outlets",
      "Advanced SEO optimization",
      "Social media sharing",
      "Press release optimization",
      "Priority email support",
      "Analytics dashboard",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 399,
    features: [
      "Distribution to 100+ media outlets",
      "Premium SEO optimization",
      "Social media sharing",
      "Press release optimization",
      "24/7 phone & email support",
      "Advanced analytics",
      "Custom branding",
      "Dedicated account manager",
    ],
    popular: false,
  },
];

function PricingContent() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    return document.cookie.includes("auth_token=");
  };
  const [selectedPlan, setSelectedPlan] = useState("professional");

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      // Encode the redirect URL to handle parameters correctly
      const returnUrl = `/dashboard/campaigns/${campaignId}/payment?plan=${selectedPlan}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    router.push(
      `/dashboard/campaigns/${campaignId}/payment?plan=${selectedPlan}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4"
      >
        <div className="mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.back()}
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
            Back
          </motion.button>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-900"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mt-2"
          >
            Select a pricing plan that fits your distribution needs
          </motion.p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden ${
                  selectedPlan === plan.id
                    ? "border-[#0A5CFF] shadow-xl"
                    : plan.popular
                      ? "border-blue-100"
                      : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#0A5CFF] to-[#3B82F6] text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-6 ${plan.popular ? "pt-12" : ""}`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/article</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-[#0A5CFF] mt-0.5 flex-shrink-0"
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
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    onClick={() => handleSelectPlan(plan.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      selectedPlan === plan.id
                        ? "bg-[#0A5CFF] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-end pt-4 border-t border-gray-200"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="primary"
                onClick={handleProceed}
                className="bg-[#0A5CFF] hover:bg-[#3B82F6]"
              >
                Continue to Payment
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PricingPage() {
  return <PricingContent />;
}
