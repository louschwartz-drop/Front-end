"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import userAuthStore from "@/store/userAuthStore";
import Button from "@/components/ui/Button";
import LoginModal from "@/components/landingPage/LoginModal";
import { toast } from "react-toastify";
import PreviewPublishModal from "@/components/user/PreviewPublishModal";

import { pricingService } from "@/lib/api/user/pricing";
import { campaignService } from "@/lib/api/user/campaigns";

function PricingContent() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedVariantByPlan, setSelectedVariantByPlan] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [campaign, setCampaign] = useState(null);

  const plansByGroup = plans.reduce((acc, plan) => {
    const name = plan.name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(plan);
    return acc;
  }, {});
  Object.keys(plansByGroup).forEach((name) => {
    plansByGroup[name].sort((a, b) => a.releasesCount - b.releasesCount);
  });
  const groupNames = Object.keys(plansByGroup);

  const getSelectedVariant = (planName) => {
    const variants = plansByGroup[planName] || [];
    const storedId = selectedVariantByPlan[planName];
    const found = variants.find((p) => p._id === storedId);
    return found || variants[0] || null;
  };

  const setSelectedVariant = (planName, plan) => {
    setSelectedVariantByPlan((prev) => ({ ...prev, [planName]: plan._id }));
  };

  const { isAuthenticated, user } = userAuthStore();
  const hasCredits = (user?.planCredits || []).some(pc => pc.remainingArticles > 0);

  useEffect(() => {
    loadData();
  }, [campaignId, hasCredits]);

  const loadData = async () => {
    try {
      // Load campaign
      const campaignRes = await campaignService.getCampaign(campaignId);
      if (campaignRes.success) {
        setCampaign(campaignRes.data);

        // If user has available releases, we used to show preview modal here,
        // but now we want to always show the pricing options so they can buy more plans.
        // The publish modal is accessible from the dashboard.
      }

      // Load pricing plans if no available releases
      const res = await pricingService.getAll();
      if (res.success) {
        const data = res.data;
        setPlans(data);
        const byName = data.reduce((acc, p) => {
          if (!acc[p.name]) acc[p.name] = [];
          acc[p.name].push(p);
          return acc;
        }, {});
        Object.keys(byName).forEach((n) => byName[n].sort((a, b) => a.releasesCount - b.releasesCount));
        const initialVariants = {};
        Object.keys(byName).forEach((n) => {
          if (byName[n][0]) initialVariants[n] = byName[n][0]._id;
        });
        setSelectedVariantByPlan(initialVariants);
        const firstGroup = Object.keys(byName)[0];
        if (firstGroup && byName[firstGroup][0]) setSelectedPlan(byName[firstGroup][0]._id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await campaignService.publishCampaign(campaignId);
      if (res.success) {
        toast.success("Campaign published successfully!");
        await userAuthStore.getState().refreshUser();
        router.push("/user/dashboard/press-releases");
      } else {
        toast.error(res.message || "Failed to publish campaign");
      }
    } catch (error) {
      console.error("Error publishing:", error);
      throw error;
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    router.push(`/user/payment/${campaignId}?plan=${selectedPlan}`);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container"
      >
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Choose Your Plan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base text-gray-600 mt-2"
            >
              Select a pricing plan for campaign #{campaignId?.slice(-8)}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="primary"
                onClick={handleProceed}
                className="w-full sm:w-auto bg-[#0A5CFF] hover:bg-[#3B82F6]"
              >
                Continue to Payment
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {groupNames.map((planName, index) => {
            const variants = plansByGroup[planName] || [];
            const selected = getSelectedVariant(planName);
            if (!selected) return null;
            const isSelected = selectedPlan === selected._id;
            return (
              <motion.div
                key={planName}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                onClick={() => handleSelectPlan(selected._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectPlan(selected._id);
                  }
                }}
                className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden flex flex-col cursor-pointer ${isSelected
                  ? "border-[#0A5CFF] shadow-xl"
                  : selected.isPopular
                    ? "border-blue-100"
                    : "border-gray-200"
                  }`}
              >
                {selected.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#0A5CFF] to-[#3B82F6] text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-4 sm:p-6 flex-1 flex flex-col ${selected.isPopular ? "pt-10 sm:pt-12" : ""}`}>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {planName}
                  </h3>
                  <div className="flex gap-2 mb-4">
                    {variants.map((v) => (
                      <button
                        key={v._id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVariant(planName, v);
                          handleSelectPlan(v._id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selected._id === v._id
                          ? "bg-[#0A5CFF] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        {v.releasesCount} {v.releasesCount === 1 ? "Article" : "Articles"}
                      </button>
                    ))}
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                      ${selected.price}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 ml-2">
                      ({selected.releasesCount} {selected.releasesCount === 1 ? "release" : "releases"})
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{selected.description}</p>

                  <ul className="space-y-3 mb-6 flex-1">
                    {(selected.features || []).map((feature, idx) => (
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(selected._id);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 sm:py-3.5 rounded-lg font-semibold transition-colors text-sm sm:text-base ${isSelected
                      ? "bg-[#0A5CFF] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {isSelected ? "Selected" : "Select Plan"}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          if (selectedPlan) {
            router.push(`/user/payment/${campaignId}?plan=${selectedPlan}`);
          }
        }}
      />

      <PreviewPublishModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        campaign={campaign}
        article={campaign?.article}
        onPublish={handlePublish}
      />
    </div>
  );
}

export default function PricingPage() {
  return <PricingContent />;
}
