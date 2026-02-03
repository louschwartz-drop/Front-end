"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

function isYouTube(url) {
  return url && (url.includes("youtube.com") || url.includes("youtu.be"));
}

async function runSocialLinkProcessing(campaignId, campaign, campaignService) {
  const userId = campaign.userId?._id || campaign.userId?.id || campaign.userId;
  const videoUrl = campaign.videoUrl;

  if (isYouTube(videoUrl)) {
    try {
      const { extractYouTubeAudioClientSide } = await import("@/utils/youtubeClientExtract");
      const { uploadAudioToS3 } = await import("@/utils/s3Upload");
      const { default: userAuthStore } = await import("@/store/userAuthStore");
      const user = userAuthStore.getState().user;
      const uid = user?._id || user?.id || userId;

      const { file, title, thumbnail } = await extractYouTubeAudioClientSide(videoUrl);
      const s3Url = await uploadAudioToS3(file, uid);
      await campaignService.processSocialLink(campaignId, {
        audioUrl: s3Url,
        videoThumbnail: thumbnail,
        title,
      });
      return;
    } catch (clientErr) {
      console.warn("[Flow] Client-side extraction failed, falling back to server:", clientErr.message);
    }
  }

  await campaignService.processSocialLink(campaignId);
}

const processingSteps = [
  "Uploading your media...",
  "Transcribing your content...",
  "Generating article from transcription...",
  "Finalizing your press release...",
];

function ProcessingContent() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const [currentStep, setCurrentStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!campaignId) {
      router.push("/dashboard");
      return;
    }

    const checkPendingUpload = async () => {
      const { default: useFileStore } = await import("@/store/filesStore");
      const { default: userAuthStore } = await import("@/store/userAuthStore");
      const { uploadVideoToS3 } = await import("@/utils/s3Upload");
      const { campaignService } = await import("@/lib/api/user/campaigns");

      const store = useFileStore.getState();
      const user = userAuthStore.getState().user;

      if (store.pendingUpload && store.pendingUpload.campaignId === campaignId) {
        // Found pending upload
        const file = store.pendingUpload.file;
        const userId = user._id || user.id;

        try {
          console.log("Starting optimized background upload...");

          // Use the new optimized endpoint instead of direct S3 + separate transcription call
          await campaignService.uploadOptimized(campaignId, file, (progress) => {
            setUploadProgress(progress);
          });

          // Clear pending upload
          store.clearPendingUpload();
          toast.success("Upload & Analysis started!");
        } catch (error) {
          console.error("Background upload failed:", error);
          toast.error("Upload failed: " + error.message);

          // Report failure to backend
          try {
            await campaignService.updateCampaign(campaignId, {
              status: "failed",
              errorMessage: `Upload failed: ${error.message}`
            });
          } catch (apiError) {
            console.error("Failed to report error to backend:", apiError);
          }
        }
      }
    };

    checkPendingUpload();

    let pollInterval;

    const pollCampaignStatus = async () => {
      try {
        const { campaignService } = await import("@/lib/api/user/campaigns");
        const response = await campaignService.getCampaign(campaignId);

        if (response.success) {
          const campaign = response.data;

          if (campaign.videoSource === "social_link" && campaign.status === "uploading") {
            if (!window[`processing_${campaignId}`]) {
              window[`processing_${campaignId}`] = true;
              runSocialLinkProcessing(campaignId, campaign, campaignService).catch(err => {
                console.error("[Flow] Social processing failed:", err);
                window[`processing_${campaignId}`] = false;
              });
            }
          }

          // Update current step based on status
          const statusToStep = {
            uploading: 0,
            uploaded: 0,
            transcribing: 1,
            generating: 2,
            finished: 3,
            failed: 3,
          };

          setCurrentStep(statusToStep[campaign.status] || 0);

          // Handle completion
          if (campaign.status === "finished") {
            setProcessingComplete(true);
            toast.success(
              "Campaign processed successfully! Redirecting to edit...",
              {
                position: "top-right",
                autoClose: 2000,
              },
            );
            // REDIRECT TO CAMPAIGNS LIST ON SUCCESS
            router.replace("/user/dashboard/campaigns");

            // Clear polling
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          } else if (campaign.status === "failed") {
            toast.error(
              campaign.errorMessage || "Campaign processing failed",
              {
                position: "top-right",
                autoClose: 5000,
              },
            );
            // Clear polling
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            // REDIRECT TO CAMPAIGNS LIST ON FAILURE
            router.replace("/user/dashboard/campaigns");
          }
        }
      } catch (error) {
        console.error("Error polling campaign status:", error);
        // If critical polling error, safe to redirect back
        if (pollInterval) clearInterval(pollInterval);
        router.replace("/user/dashboard/campaigns");
      }
    };

    // Initial poll
    pollCampaignStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(pollCampaignStatus, 3000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [campaignId, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full text-center"
        >
          <motion.div
            className="mb-8"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#0A5CFF] to-[#3B82F6] rounded-full flex items-center justify-center mx-auto shadow-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {processingComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 text-green-500 mx-auto"
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
                </motion.svg>
                <h2 className="text-3xl font-bold text-gray-900">
                  Processing Complete!
                </h2>
                <p className="text-gray-600">Redirecting to edit screen...</p>
              </motion.div>
            ) : (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
                  >
                    {processingSteps[currentStep]}
                  </motion.h2>
                </AnimatePresence>

                <div className="flex justify-center gap-2">
                  {processingSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-2 rounded-full ${index === currentStep
                        ? "bg-[#0A5CFF] w-8"
                        : index < currentStep
                          ? "bg-green-500 w-2"
                          : "bg-gray-300 w-2"
                        }`}
                      animate={{
                        width:
                          index === currentStep
                            ? 32
                            : index < currentStep
                              ? 8
                              : 8,
                        backgroundColor:
                          index === currentStep
                            ? "#0A5CFF"
                            : index < currentStep
                              ? "#10B981"
                              : "#D1D5DB",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                <p className="text-gray-600 text-base sm:text-lg">
                  This may take a few moments. Please don't close this page.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ProcessingPage() {
  return <ProcessingContent />;
}
