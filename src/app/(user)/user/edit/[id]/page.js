"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText, Video, Volume2, VolumeX } from "lucide-react";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import PreviewPublishModal from "@/components/user/PreviewPublishModal";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import userAuthStore from "@/store/userAuthStore";
import { PREDEFINED_CATEGORIES } from "@/lib/constants";

const SPEECH_SEQUENCE = [
  "headline",
  "introduction",
  "summary",
  "quote",
  "body",
  "conclusion",
  "cta",
  "sidebar-product",
  "sidebar-author"
];

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingAction, setRegeneratingAction] = useState(null);
  const [headlineRegenerated, setHeadlineRegenerated] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const utteranceRef = useRef(null);

  // Pre-load voices for TTS consistency
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Final cleanup for speech
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidated, setIsValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [xprStoryPayload, setXprStoryPayload] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAiScoreSheet, setShowAiScoreSheet] = useState(false);

  const [editData, setEditData] = useState({
    headline: "",
    locationDate: "",
    introduction: "",
    body: "",
    productSummary: {
      category: "",
      useCase: "",
      positioning: "",
    },
    ctaText: "",
    conclusion: "",
    creatorQuote: "",
    summary: "",
    categories: "",
  });

  const [productCard, setProductCard] = useState({
    productName: "",
    thumbnail: "",
    affiliateLink: "",
    authorName: "",
    sourceVideoLink: "",
  });

  const [context, setContext] = useState({
    tone: "Informative",
    goal: "Awareness",
    publisherTier: "Standard",
  });

  const [sourceLinkError, setSourceLinkError] = useState("");
  const [thumbnailUrlError, setThumbnailUrlError] = useState("");
  const [affiliateLinkError, setAffiliateLinkError] = useState("");

  const isValidUrl = (str) => {
    if (!str || typeof str !== "string") return false;
    try {
      const u = new URL(str);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const [validatingImage, setValidatingImage] = useState(false);

  const checkImageValidity = async (url) => {
    if (!url || !isValidUrl(url)) {
      setValidatingImage(false);
      return;
    }

    setValidatingImage(true);
    const isValid = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 5000);
    });

    if (!isValid) {
      setThumbnailUrlError("This image URL seems broken or unreachable.");
    } else {
      setThumbnailUrlError("");
    }
    setValidatingImage(false);
  };

  const debouncedImageCheck = useCallback(
    debounce((url) => {
      checkImageValidity(url);
    }, 1000),
    []
  );

  useEffect(() => {
    if (productCard.thumbnail && isValidUrl(productCard.thumbnail)) {
      // Don't validate if it's already the initial value or a known good one
      // But for simplicity in this reactive form, we check when it changes
      debouncedImageCheck(productCard.thumbnail);
    } else {
      setValidatingImage(false);
      if (!productCard.thumbnail) setThumbnailUrlError("");
    }
  }, [productCard.thumbnail, debouncedImageCheck]);

  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [versions, setVersions] = useState([]);

  const { user } = userAuthStore();

  const isLimitReached = versions.length >= 10;

  // Options for dropdowns
  const contextOptions = {
    tone: ["Informative", "Persuasive", "Casual", "Professional", "Excited", "Analytical"],
    goal: ["Awareness", "Conversion", "Education", "Brand Authority", "Lead Gen"],
    publisherTier: ["Standard", "Premium", "Enterprise", "Niche Blog", "Social-First"],
  };

  // Auto-save logic
  const debouncedSave = useCallback(
    debounce(async (data, product, ctx) => {
      // Check if data actually changed from last saved or initial
      const currentPayload = JSON.stringify({ data, product, ctx });
      if (initialData === currentPayload) return;

      // If limit reached, only allow updating product card
      const payload = isLimitReached
        ? { productCard: product }
        : { article: data, productCard: product, context: ctx };

      try {
        const { campaignService } = await import("@/lib/api/user/campaigns");
        await campaignService.updateCampaign(campaignId, payload);
        setLastSaved(new Date());
        setInitialData(currentPayload);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 5000),
    [campaignId, initialData, isLimitReached]
  );

  useEffect(() => {
    if (loading) return;
    debouncedSave(editData, productCard, context);
  }, [editData, productCard, context, debouncedSave, loading]);

  useEffect(() => {
    if (!campaignId || campaignId === "undefined") {
      router.push("/user/dashboard");
      return;
    }

    if (campaignId) {
      const fetchCampaign = async () => {
        try {
          const { campaignService } = await import("@/lib/api/user/campaigns");
          const response = await campaignService.getCampaign(campaignId);

          if (response.success) {
            const campaign = response.data;
            if (campaign.article) {
              setEditData({
                headline: campaign.article.headline || "",
                locationDate: campaign.article.locationDate || "",
                introduction: campaign.article.introduction || "",
                body: campaign.article.body || "",
                productSummary: campaign.article.productSummary || {
                  category: "",
                  useCase: "",
                  positioning: "",
                },
                ctaText: campaign.article.ctaText || "",
                conclusion: campaign.article.conclusion || "",
                creatorQuote: campaign.article.creatorQuote || "",
                summary: campaign.article.summary || "",
                categories: campaign.article.categories || "",
              });
            }
            if (campaign.productCard) {
              setProductCard({
                productName: campaign.productCard.productName || "",
                thumbnail: campaign.productCard.thumbnail || "",
                affiliateLink: campaign.productCard.affiliateLink || "",
                authorName: campaign.productCard.authorName || campaign.productCard.creatorAttribution || user?.name || user?.firstName || "",
                sourceVideoLink: campaign.productCard.sourceVideoLink || "",
              });
            }
            if (campaign.context) {
              setContext(campaign.context);
            }
            if (campaign.versions) {
              setVersions(campaign.versions);
            }

            // Sync thumbnail if empty on the card but present on top level
            let activeThumbnail = campaign.productCard?.thumbnail || "";
            if (!activeThumbnail && campaign.videoThumbnail) {
              activeThumbnail = campaign.videoThumbnail;
              setProductCard(prev => ({ ...prev, thumbnail: activeThumbnail }));
            }

            // Capture initial state to prevent redundant auto-saves
            setInitialData(JSON.stringify({
              data: campaign.article || editData,
              product: { ...campaign.productCard, thumbnail: activeThumbnail } || productCard,
              ctx: campaign.context || context
            }));
          }
        } catch (error) {
          console.error("Error fetching campaign:", error);
          toast.error("Failed to load campaign data");
        } finally {
          setLoading(false);
        }
      };
      fetchCampaign();
    }
  }, [campaignId]);


  const handleRegenerate = async (actionId) => {
    setRegenerating(true);
    setRegeneratingAction(actionId);

    try {
      const { campaignService } = await import("@/lib/api/user/campaigns");
      const response = await campaignService.performAiEdit(campaignId, actionId);

      if (response.success) {
        setEditData(prev => ({
          ...prev,
          headline: response.data.article.headline || "",
          locationDate: response.data.article.locationDate || "",
          introduction: response.data.article.introduction || "",
          body: response.data.article.body || "",
          productSummary: response.data.article.productSummary || prev.productSummary,
          ctaText: response.data.article.ctaText || "",
          conclusion: response.data.article.conclusion || "",
          creatorQuote: response.data.article.creatorQuote || "",
          summary: response.data.article.summary || "",
          categories: response.data.article.categories || prev.categories,
        }));
        setVersions(response.data.versions);
        if (actionId === "OPTIMIZE_HEADLINE") {
          setHeadlineRegenerated(true);
        }
        toast.success("AI Content Updated with Context!", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error(response.message || "AI Edit failed");
      }
    } catch (error) {
      console.error("AI Edit failed:", error);
      toast.error("Failed to perform AI Edit");
    } finally {
      setRegenerating(false);
      setRegeneratingAction(null);
    }
  };

  const getFieldContent = (fieldId) => {
    switch (fieldId) {
      case 'headline': return editData.headline;
      case 'introduction': return editData.introduction;
      case 'summary': return editData.summary;
      case 'quote': return editData.creatorQuote;
      case 'body': return editData.body;
      case 'conclusion': return editData.conclusion;
      case 'cta': return editData.ctaText;
      case 'sidebar-product': return productCard.productName;
      case 'sidebar-author': return productCard.authorName;
      default: return "";
    }
  };

  const toggleSpeech = (text, fieldId) => {
    // 1. If already speaking THIS field, just stop
    if (currentlySpeaking === fieldId) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      return;
    }

    // 2. If speaking SOMETHING ELSE, cancel it first and clear its callbacks
    if (window.speechSynthesis.speaking || currentlySpeaking) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    }

    if (!text) {
      toast.info("This field is empty.");
      setCurrentlySpeaking(null);
      return;
    }

    // 3. Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(v => v.name.includes("Natural") && v.lang.startsWith("en"))
      || voices.find(v => v.name.includes("Online") && v.lang.startsWith("en"))
      || voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"))
      || voices.find(v => ["Samantha", "Daniel", "Alex"].includes(v.name) && v.lang.startsWith("en"))
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setCurrentlySpeaking(null);
      utteranceRef.current = null;

      // Auto-advance logic
      const currentIndex = SPEECH_SEQUENCE.indexOf(fieldId);
      if (currentIndex !== -1 && currentIndex < SPEECH_SEQUENCE.length - 1) {
        const nextFieldId = SPEECH_SEQUENCE[currentIndex + 1];
        const nextContent = getFieldContent(nextFieldId);

        // Only jump if there's content to read
        if (nextContent?.trim()) {
          // Small delay for natural pacing between sections
          setTimeout(() => {
            toggleSpeech(nextContent, nextFieldId);
          }, 600);
        }
      }
    };
    utterance.onerror = () => {
      setCurrentlySpeaking(null);
      utteranceRef.current = null;
    };

    setCurrentlySpeaking(fieldId);
    window.speechSynthesis.speak(utterance);
  };

  const handleRestore = (version) => {
    setEditData(prev => ({
      ...prev,
      headline: version.article.headline || "",
      locationDate: version.article.locationDate || "",
      introduction: version.article.introduction || "",
      body: version.article.body || "",
      productSummary: version.article.productSummary || prev.productSummary,
      ctaText: version.article.ctaText || "",
      conclusion: version.article.conclusion || "",
      creatorQuote: version.article.creatorQuote || "",
      summary: version.article.summary || "",
    }));
    setShowVersions(false);
    toast.success("Version restored!");
  };

  const fileInputRef = useRef(null);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    setUploadingThumbnail(true);
    try {
      const { campaignService } = await import("@/lib/api/user/campaigns");
      const response = await campaignService.uploadThumbnail(campaignId, formData);
      if (response.success) {
        setProductCard(prev => ({ ...prev, thumbnail: response.data.videoThumbnail }));
        toast.success("Thumbnail uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handlePublishClick = async () => {
    // 1. Run Validation First
    setValidating(true);
    setValidationErrors([]);
    try {
      await userAuthStore.getState().refreshUser();
      const currentUser = userAuthStore.getState().user;

      const storyId = campaignId || Date.now().toString();
      const headline = editData.headline || "Untitled Article";

      // Constructing HTML Content (excluding title and summary which are sent explicitly)
      let htmlContent = "";

      // 1. Dateline Integration
      const dateline = editData.locationDate ? `<strong>${editData.locationDate.toUpperCase()} — </strong>` : "";

      // 2. Introduction (Lede)
      if (editData.introduction) {
        htmlContent += `<p>${dateline}${editData.introduction}</p>`;
      } else if (dateline) {
        htmlContent += `<p>${dateline}</p>`;
      }

      // 3. Main Body (Supports both plain text and AI-generated HTML structure from "Improve with AI")
      if (editData.body) {
        const containsHTML = /<[a-z][\s\S]*>/i.test(editData.body);
        if (containsHTML) {
          // AI provided structure (<h3>, <p>, etc.) - Clean up newlines but trust the tags
          htmlContent += editData.body.trim();
        } else {
          // Legacy plain text - auto-wrap paragraphs
          htmlContent += `<p>${editData.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
        }
      }

      // 4. Expert Quote (Semantic Blockquote)
      if (editData.creatorQuote) {
        htmlContent += `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #374151;">
          <p style="font-size: 1.1rem; line-height: 1.6;">"${editData.creatorQuote}"</p>`;
        if (productCard.authorName) {
          htmlContent += `<footer style="margin-top: 0.75rem; font-weight: 700; font-style: normal; color: #111827;">— ${productCard.authorName}</footer>`;
        }
        htmlContent += `</blockquote>`;
      }

      // 5. Featured Product Section
      if (productCard.productName) {
        htmlContent += `<div style="margin: 2rem 0; padding: 1.5rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h3 style="margin-top: 0; color: #111827;">Featured Product: ${productCard.productName}</h3>`;
        if (productCard.thumbnail) {
          htmlContent += `<img src="${productCard.thumbnail}" alt="${productCard.productName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />`;
        }
        if (productCard.affiliateLink) {
          htmlContent += `<p style="margin-bottom: 0;"><strong>Product Page:</strong> <a href="${productCard.affiliateLink}" style="color: #2563eb; text-decoration: underline;">${productCard.affiliateLink}</a></p>`;
        }
        htmlContent += `</div>`;
      }

      // 6. Conclusion
      if (editData.conclusion) htmlContent += `<p>${editData.conclusion}</p>`;

      // 7. Media Contact Section (Critical for XPR Scoring)
      htmlContent += `
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #f3f4f6;">
          <h4 style="text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Media Contact:</h4>
          <p style="margin: 0; font-weight: 700; color: #111827;">${productCard.authorName || currentUser?.name || "Media Relations Department"}</p>
          <p style="margin: 4px 0; color: #4b5563;">${currentUser?.email || "press@droppr.ai"}</p>
          <p style="margin: 0; color: #9ca3af; font-size: 0.75rem;">Source: Droppr AI Newsroom Network</p>
        </div>
      `;

      const summary = editData.summary || editData.introduction || "";
      const image = productCard.thumbnail || "";
      const author = productCard.authorName || currentUser?.name || currentUser?.firstName || "Press Services";
      const categoriesArray = editData.categories
        ? editData.categories.split(",").map(c => c.trim()).filter(c => c)
        : [];

      const xprStoryPayload = {
        title: headline,
        summary: summary,
        content: htmlContent ? `<div>${htmlContent}</div>` : "<div>No Content</div>",
        link: `https://droppr.ai/article/${storyId}`, // Adjust once actual links are live
        imageUrl: image,
        author: author,
        publishedAt: new Date().toISOString(),
        guid: storyId,
      };

      if (categoriesArray.length > 0) {
        xprStoryPayload.categories = categoriesArray;
      }

      console.log("XPR Media Payload:", JSON.stringify(xprStoryPayload, null, 2));
      setXprStoryPayload(xprStoryPayload);

      const xprArticleRelease = (await import("@/lib/api/user/xprArticleRelease")).default;
      const response = await xprArticleRelease.precheck(xprStoryPayload, campaignId);

      // Validation passed, check AI score
      const aiAnalysisData = response?.data?.aiAnalysis;
      setAiAnalysis(aiAnalysisData);

      // ALWAYS show the AI score sheet modal after validation
      setShowAiScoreSheet(true);

      if (aiAnalysisData && aiAnalysisData.score < 70) {
        toast.warn("AI Quality Score is too low for publication. Please improve the content.");
      }
    } catch (error) {
      console.error("Validation failed:", error);
      toast.error("Failed to validate article.");
      setValidationErrors([error.message || "Failed to contact validation server."]);
      setShowValidationModal(true);
    } finally {
      setValidating(false);
    }
  };

  const handleInitiatePublish = async () => {
    try {
      await userAuthStore.getState().refreshUser();
      const currentUser = userAuthStore.getState().user;
      const hasCredits = (currentUser?.planCredits || []).some(pc => pc.remainingArticles > 0);

      if (hasCredits) {
        setShowAiScoreSheet(false);
        setShowPublishModal(true);
      } else {
        toast.info("No releases available. Redirecting to pricing...");
        router.push(`/user/pricing/${campaignId}`);
      }
    } catch (error) {
      console.error("Initiate publish failed:", error);
      toast.error("Failed to check credits. Please try again.");
    }
  };




  const handleConfirmPublish = async (planId = null) => {
    try {
      const { pressReleaseService } = await import("@/lib/api/user/press-releases");
      const response = await pressReleaseService.publish(campaignId, planId, xprStoryPayload);

      if (response.success) {
        toast.success(response.message || "Published successfully!");
        await userAuthStore.getState().refreshUser();
        setShowPublishModal(false);
        router.push("/user/dashboard/press-releases");
      } else {
        toast.error(response.message || "Failed to publish");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish campaign");
      throw error;
    }
  };

  const isPublishDisabled =
    !editData.headline?.trim() ||
    !editData.introduction?.trim() ||
    !editData.summary?.trim() ||
    !editData.creatorQuote?.trim() ||
    !editData.body?.trim() ||
    !editData.conclusion?.trim() ||
    !editData.ctaText?.trim() ||
    !productCard.productName?.trim() ||
    !productCard.thumbnail?.trim() ||
    !productCard.affiliateLink?.trim() ||
    !productCard.authorName?.trim() ||
    !productCard.sourceVideoLink?.trim() ||
    !isValidUrl(productCard.thumbnail) ||
    !isValidUrl(productCard.affiliateLink) ||
    !isValidUrl(productCard.sourceVideoLink) ||
    !!thumbnailUrlError ||
    validatingImage;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-0 sm:px-3 md:px-4 py-3 flex items-center justify-around sm:justify-between shadow-sm">
        <div className="flex items-center sm:gap-2 md:gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 p-1 md:p-0">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 hidden sm:block">Editor</h1>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="text-[10px] md:text-xs text-gray-500 max-w-[120px] sm:max-w-none truncate">
            {lastSaved ? `Auto-saved at ${lastSaved.toLocaleTimeString()}` : "Ready to edit"}
          </div>
        </div>

        <div className="flex items-center sm:gap-2 md:gap-3">
          <button
            onClick={() => setShowVersions(true)}
            className="p-1 sm:p-2 md:px-4 md:py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
            title="History"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Versions ({versions.length})</span>
            <span className="sm:hidden text-xs font-bold text-gray-500">({versions.length})</span>
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="p-1 sm:p-2 md:px-4 md:py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg flex items-center gap-2"
            title="Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Preview Look</span>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-2 sm:px-4 py-8">
        {/* Limit Warning Banner */}
        {isLimitReached && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
          >
            <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold">!</div>
            <div>
              <h4 className="text-red-800 font-bold text-sm">You have reached your maximum edits limit.</h4>
              <p className="text-red-600 text-[11px]">The main article content is now locked. You can still update the Product Mandatory Card below.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Editor Section */}
          <div className={`lg:col-span-8 space-y-6 ${isLimitReached ? "pointer-events-none" : ""}`}>

            {/* Campaign Context Chips */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Campaign-Aware Edits</span>
                <div className="h-1 w-1 bg-blue-300 rounded-full"></div>
                <span className="text-[10px] text-blue-400">Context active</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(context).map(([key, value]) => (
                  <div key={key} className="flex items-center bg-white border border-blue-200 rounded-full px-3 py-1 gap-2 shadow-sm relative group/chip">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <select
                      value={value}
                      onChange={(e) => setContext({ ...context, [key]: e.target.value })}
                      className="text-xs font-semibold text-blue-600 bg-transparent border-none focus:ring-0 p-0 pr-6 appearance-none cursor-pointer"
                      disabled={isLimitReached || regenerating}
                    >
                      {contextOptions[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <svg className="w-2.5 h-2.5 text-blue-300 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ))}
                <button
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={regenerating || isLimitReached}
                  className="ml-auto bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-blue-600 shadow-md shadow-blue-100 disabled:bg-gray-400"
                >
                  {regenerating && regeneratingAction === "REWRITE_WITH_CONTEXT" ? "Rewriting..." : "Apply All"}
                </button>
              </div>
            </div>

            {/* Structured Editor Cards */}
            <div className="space-y-6">
              {/* Headline Section */}
              <SectionCard
                label="Headline"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("OPTIMIZE_HEADLINE")}
                aiLabel={regenerating && regeneratingAction === "OPTIMIZE_HEADLINE" ? "Optimizing..." : "Optimize Headline"}
                aiDisabled={regenerating}
                onSpeak={() => toggleSpeech(editData.headline, 'headline')}
                isSpeaking={currentlySpeaking === 'headline'}
              >
                <input
                  value={editData.headline}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                  className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300 disabled:text-gray-400"
                  placeholder="Newsworthy headline..."
                />
              </SectionCard>



              {/* Lede Section */}
              <SectionCard
                label="Lede (Introduction)"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("EXPAND_LEDE")}
                aiLabel={regenerating && regeneratingAction === "EXPAND_LEDE" ? "Expanding..." : "Expand Lede"}
                aiDisabled={regenerating}
                onSpeak={() => toggleSpeech(editData.introduction, 'introduction')}
                isSpeaking={currentlySpeaking === 'introduction'}
              >
                <textarea
                  value={editData.introduction}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, introduction: e.target.value })}
                  rows={3}
                  className="w-full text-gray-700 leading-relaxed border-none focus:ring-0 p-0 resize-none disabled:text-gray-400"
                  placeholder="The hook that draws readers in..."
                />
              </SectionCard>

              {/* Summary Section (Required by XPR Media) */}
              <SectionCard
                label="Press Release Summary"
                disabled={isLimitReached}
                onSpeak={() => toggleSpeech(editData.summary, 'summary')}
                isSpeaking={currentlySpeaking === 'summary'}
              >
                <textarea
                  value={editData.summary}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  rows={2}
                  maxLength={250}
                  className="w-full text-gray-700 leading-relaxed border-none focus:ring-0 p-0 resize-none disabled:text-gray-400"
                  placeholder="A concise summary of the article (max 200-250 chars). Requires for XPR Media..."
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] ${editData.summary?.length > 200 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {editData.summary?.length || 0} / 250
                  </span>
                </div>
              </SectionCard>

              <SectionCard
                label="Creator Quote"
                disabled={isLimitReached}
                onSpeak={() => toggleSpeech(editData.creatorQuote, 'quote')}
                isSpeaking={currentlySpeaking === 'quote'}
              >
                <div className="space-y-3">
                  <textarea
                    value={editData.creatorQuote}
                    disabled={isLimitReached}
                    onChange={(e) => setEditData({ ...editData, creatorQuote: e.target.value })}
                    rows={2}
                    className="w-full text-gray-700 border-none focus:ring-0 p-0 resize-none italic font-serif disabled:text-gray-400"
                    placeholder="An authentic quote from the video..."
                  />
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Attributed to:</span>
                    {isEditingAuthor ? (
                      <input
                        value={productCard.authorName}
                        onChange={(e) => setProductCard({ ...productCard, authorName: e.target.value })}
                        onBlur={() => setIsEditingAuthor(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingAuthor(false)}
                        autoFocus
                        className="text-[10px] font-bold text-primary bg-blue-50/50 border-none focus:ring-0 p-0"
                      />
                    ) : (
                      <div className="flex items-center gap-1 group/author">
                        <span className="text-[10px] font-bold text-primary">{productCard.authorName || "Author"}</span>
                        <button
                          onClick={() => setIsEditingAuthor(true)}
                          className="p-1 hover:bg-gray-100 rounded transition-all"
                          title="Edit Author Name"
                        >
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Body Content Section */}
              <SectionCard
                label="Main Body"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("IMPROVE_NARRATIVE_FLOW")}
                aiLabel={regenerating && regeneratingAction === "IMPROVE_NARRATIVE_FLOW" ? "Improving..." : "Improve Narrative Flow"}
                aiDisabled={regenerating}
                secondaryAction={() => handleRegenerate("CONDENSE_BODY")}
                secondaryLabel={regenerating && regeneratingAction === "CONDENSE_BODY" ? "Condensing..." : "Condense Body"}
                secondaryDisabled={headlineRegenerated || regenerating}
                onSpeak={() => toggleSpeech(editData.body, 'body')}
                isSpeaking={currentlySpeaking === 'body'}
              >
                <textarea
                  value={editData.body}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, body: e.target.value })}
                  rows={10}
                  className="w-full text-gray-700 leading-7 border-none focus:ring-0 p-0 resize-none disabled:text-gray-400"
                  placeholder="The core narrative using the creator's voice..."
                />
              </SectionCard>

              {/* Conclusion Section */}
              <SectionCard
                label="Conclusion"
                disabled={isLimitReached}
                onSpeak={() => toggleSpeech(editData.conclusion, 'conclusion')}
                isSpeaking={currentlySpeaking === 'conclusion'}
              >
                <textarea
                  value={editData.conclusion}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, conclusion: e.target.value })}
                  rows={2}
                  className="w-full text-gray-700 border-none focus:ring-0 p-0 resize-none italic disabled:text-gray-400"
                  placeholder="Final thoughts..."
                />
              </SectionCard>

              {/* CTA Section */}
              <SectionCard
                label="Mandatory CTA"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("OPTIMIZE_FOR_CONVERSION")}
                aiLabel={regenerating && regeneratingAction === "OPTIMIZE_FOR_CONVERSION" ? "Optimizing..." : "Optimize for Conversion"}
                aiDisabled={regenerating}
                onSpeak={() => toggleSpeech(editData.ctaText, 'cta')}
                isSpeaking={currentlySpeaking === 'cta'}
              >
                <div className="flex flex-col gap-4">
                  <input
                    value={editData.ctaText}
                    disabled={isLimitReached}
                    onChange={(e) => setEditData({ ...editData, ctaText: e.target.value })}
                    className="w-full text-[12px] sm:text-[15px] font-bold text-primary border border-blue-100 rounded-lg p-2 sm:p-3 bg-blue-50/20 disabled:text-blue-300 disabled:border-gray-100 disabled:bg-gray-50"
                    placeholder="Buy [Product Name] Today..."
                  />
                  <div className="p-2 sm:p-4 text-[15px] sm:text-normal rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center">
                    <button className="px-6 py-2 bg-primary text-white font-bold rounded shadow-md pointer-events-none opacity-50">
                      {editData.ctaText || "CTA Button Preview"}
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Sidebar / Sidebar Cards */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-4 py-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Mandatory Product Card
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <SidebarField
                  label="Product Name"
                  value={productCard.productName}
                  onChange={(val) => setProductCard({ ...productCard, productName: val })}
                  onSpeak={() => toggleSpeech(productCard.productName, 'sidebar-product')}
                  isSpeaking={currentlySpeaking === 'sidebar-product'}
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Thumbnail URL</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-[10px] font-bold ${uploadingThumbnail ? "text-gray-400" : "text-primary hover:underline"}`}
                      disabled={uploadingThumbnail}
                    >
                      {uploadingThumbnail ? "Uploading..." : "Upload File"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  <input
                    value={productCard.thumbnail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductCard({ ...productCard, thumbnail: val });
                      setThumbnailUrlError(val && !isValidUrl(val) ? "Please enter a valid URL (e.g. https://...)" : "");
                    }}
                    onBlur={() => {
                      const val = productCard.thumbnail;
                      if (val && !isValidUrl(val)) {
                        setThumbnailUrlError("Please enter a valid URL (e.g. https://...)");
                      }
                    }}
                    className={`w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 transition-all outline-none ${thumbnailUrlError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"}`}
                    placeholder="https://..."
                  />
                  {thumbnailUrlError && <p className="text-[10px] text-red-500 font-medium mt-1">{thumbnailUrlError}</p>}
                  {productCard.thumbnail && !thumbnailUrlError && (
                    <div className="mt-2 w-[100px] h-[100px] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                      <img src={productCard.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <SidebarField
                  label="Affiliate Link"
                  value={productCard.affiliateLink}
                  onChange={(val) => {
                    setProductCard({ ...productCard, affiliateLink: val });
                    setAffiliateLinkError(val && !isValidUrl(val) ? "Please enter a valid URL (e.g. https://...)" : "");
                  }}
                  error={affiliateLinkError}
                  placeholder="https://..."
                  onSpeak={() => toggleSpeech(productCard.affiliateLink, 'sidebar-affiliate')}
                  isSpeaking={currentlySpeaking === 'sidebar-affiliate'}
                />
                <SidebarField
                  label="Author Name"
                  value={productCard.authorName}
                  onChange={(val) => setProductCard({ ...productCard, authorName: val })}
                  onSpeak={() => toggleSpeech(productCard.authorName, 'sidebar-author')}
                  isSpeaking={currentlySpeaking === 'sidebar-author'}
                />

                <SidebarField
                  label="Source Video Link"
                  value={productCard.sourceVideoLink}
                  onChange={(val) => {
                    setProductCard({ ...productCard, sourceVideoLink: val });
                    setSourceLinkError(val && !isValidUrl(val) ? "Please enter a valid URL (e.g. https://...)" : "");
                  }}
                  error={sourceLinkError}
                  placeholder="https://..."
                  onSpeak={() => toggleSpeech(productCard.sourceVideoLink, 'sidebar-source')}
                  isSpeaking={currentlySpeaking === 'sidebar-source'}
                />

                <CategorySelector
                  categories={editData.categories}
                  onChange={(val) => setEditData({ ...editData, categories: val })}
                />

                <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                    <div className="h-5 w-5 text-blue-500 mt-0.5">ℹ️</div>
                    <p className="text-[10px] text-blue-700 leading-normal">
                      Publishing is disabled until all required fields are complete and URLs are valid. Categories are optional. The article will be validated upon publishing.
                    </p>
                  </div>

                  <button
                    disabled={isPublishDisabled || validating}
                    onClick={handlePublishClick}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex justify-center items-center gap-2 ${isPublishDisabled || validating
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-600 to-primary text-white hover:shadow-lg focus:ring-4 focus:ring-blue-100"
                      }`}
                  >
                    {validating ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Validating...
                      </>
                    ) : (
                      "Publish Article"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Score Sheet Modal */}
      <AnimatePresence>
        {showAiScoreSheet && aiAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setShowAiScoreSheet(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${aiAnalysis.score >= 90 ? "bg-green-100 text-green-600 border-green-200" :
                    aiAnalysis.score >= 80 ? "bg-blue-100 text-blue-600 border-blue-200" :
                      "bg-amber-100 text-amber-600 border-amber-200"
                    }`}>
                    {aiAnalysis.score}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">AI Content Score</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">XPR Media Quality Analysis</p>
                  </div>
                </div>
                <button onClick={() => setShowAiScoreSheet(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Score Meaning */}
                <div className={`rounded-xl p-5 border-2 ${aiAnalysis.score < 70 ? "bg-red-50 border-red-200" : "bg-blue-50/50 border-blue-100"
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analysis Summary</span>
                    {aiAnalysis.score < 70 && <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">CRITICAL IMPROVEMENT NEEDED</span>}
                  </div>
                  <p className={`text-[15px] leading-relaxed font-bold ${aiAnalysis.score < 70 ? "text-red-900" : "text-blue-900 italic"}`}>
                    {aiAnalysis.score < 70
                      ? `Publish Blocked: Your score is ${aiAnalysis.score}/100. XPR Media requires a minimum score of 70. Please use the "Improve with AI" tool to address the issues below.`
                      : `"${aiAnalysis.summary || "Your article meets the quality standards for publication."}"`
                    }
                  </p>
                  {aiAnalysis.summary && aiAnalysis.score < 70 && (
                    <p className="mt-3 text-sm text-red-700 font-medium leading-relaxed bg-white/50 p-3 rounded-lg border border-red-100">
                      <strong>Focus:</strong> {aiAnalysis.summary}
                    </p>
                  )}
                </div>

                {/* Classification Check */}
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${aiAnalysis.classification === 'PRESS_RELEASE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {aiAnalysis.classification?.replace('_', ' ') || 'ANALYZING'}
                  </div>
                  <span className="text-xs font-bold text-gray-500">Classification</span>
                </div>

                {/* Suggested Edits */}
                {aiAnalysis.suggestedEdits && aiAnalysis.suggestedEdits.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Improvement Suggestions
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.suggestedEdits.map((edit, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50/30 border border-amber-100/50 rounded-xl">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span className="text-sm text-gray-800 font-medium leading-relaxed">{edit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowAiScoreSheet(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Manual Edit
                </button>
                <div className="flex gap-3">
                  {aiAnalysis.score < 85 && (
                    <button
                      disabled={regenerating}
                      onClick={async () => {
                        setShowAiScoreSheet(false);
                        // Call handleAiEdit with a special action for "Improve Score"
                        // We need to pass the current aiAnalysis as feedback
                        setRegenerating(true);
                        setRegeneratingAction("IMPROVE_AI_SCORE");
                        try {
                          const { campaignService } = await import("@/lib/api/user/campaigns");
                          const response = await campaignService.performAiEdit(campaignId, "IMPROVE_AI_SCORE", aiAnalysis);
                          if (response.success) {
                            setEditData(prev => ({
                              ...prev,
                              headline: response.data.article.headline || prev.headline,
                              summary: response.data.article.summary || prev.summary,
                              introduction: response.data.article.introduction || prev.introduction,
                              body: response.data.article.body || prev.body,
                              creatorQuote: response.data.article.creatorQuote || prev.creatorQuote,
                              conclusion: response.data.article.conclusion || prev.conclusion,
                              ctaText: response.data.article.ctaText || prev.ctaText,
                              locationDate: response.data.article.locationDate || prev.locationDate,
                            }));
                            setVersions(response.data.versions);
                            toast.success("AI significantly improved your content score and depth!");
                          }
                        } catch (e) {
                          console.error(e);
                          toast.error("AI improvement failed.");
                        } finally {
                          setRegenerating(false);
                          setRegeneratingAction(null);
                        }
                      }}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      {regenerating ? "Improving..." : "Improve with AI"}
                    </button>
                  )}
                  {aiAnalysis.score >= 70 && (
                    <button
                      onClick={handleInitiatePublish}
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-gray-800 transition-all shadow-lg"
                    >
                      Publish Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Validation Modal */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setShowValidationModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                <h3 className="font-bold text-gray-900 text-lg">Validation Failed</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please correct the following issues before publishing to XPR Media:
                </p>
                <ul className="space-y-2">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Close & Fix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regeneration Confirmation */}
      <ConfirmationModal
        isOpen={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={() => {
          setShowRegenConfirm(false);
          handleRegenerate("REWRITE_WITH_CONTEXT");
        }}
        title="Regenerate Full Article?"
        message="This will overwrite your current article content using the updated context. Your current version will be saved in the history, but any unsaved manual changes to the body or headline might be lost."
        confirmText="Regenerate Content"
        confirmColor="bg-primary hover:bg-blue-700"
      />

      {/* Preview Modal */}
      <FullArticlePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        campaign={{ _id: campaignId }}
        article={editData}
        productCard={productCard}
      />

      {/* Versions Modal */}
      <AnimatePresence>
        {showVersions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowVersions(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-900">Previous Versions</h3>
                <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {versions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No versions saved yet</div>
                ) : (
                  versions.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => handleRestore(v)}
                      className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">Version {versions.length - i}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{new Date(v.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 font-bold transition-opacity">Restore</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Publish Preview Modal */}
      <PreviewPublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        campaign={{ _id: campaignId, article: editData, context }}
        article={editData}
        onPublish={handleConfirmPublish}
        storyPayload={xprStoryPayload}
      />
    </div>
  );
}

function SectionCard({ label, children, onAiAction, aiLabel, aiDisabled, secondaryAction, secondaryLabel, secondaryDisabled, disabled, onSpeak, isSpeaking }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group transition-opacity ${disabled ? "opacity-75" : ""}`}>
      <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
          {onSpeak && (
            <button
              onClick={onSpeak}
              className={`p-1 rounded-lg transition-all ${isSpeaking ? "bg-red-100 text-red-500" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}
              title={isSpeaking ? "Stop" : "Listen"}
            >
              <motion.div animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </motion.div>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {onAiAction && (
            <button
              onClick={onAiAction}
              disabled={disabled || aiDisabled}
              className="bg-white border border-blue-200 text-primary text-[9px] sm:text-[10px] font-bold px-1 sm:px-3 py-1 rounded-full hover:bg-blue-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              disabled={disabled || secondaryDisabled}
              className="bg-white border border-gray-200 text-gray-600 text-[9px] sm:text-[10px] font-bold px-1 sm:px-3 py-1 rounded-full hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
      <div className={`p-6 ${disabled ? "pointer-events-none select-none" : ""}`}>{children}</div>
    </div>
  );
}

function CategorySelector({ categories, onChange }) {
  const [inputValue, setInputValue] = useState("");
  const categoriesList = categories ? categories.split(",").map(c => c.trim()).filter(c => c) : [];

  const handleAddCategory = (cat) => {
    if (!cat) return;
    const cleanCat = cat.replace(/,/g, "").trim();
    if (cleanCat && !categoriesList.includes(cleanCat)) {
      const newCategories = [...categoriesList, cleanCat].join(", ");
      onChange(newCategories);
    }
    setInputValue("");
  };

  const handleRemoveCategory = (cat) => {
    const newCategories = categoriesList.filter(c => c !== cat).join(", ");
    onChange(newCategories);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCategory(inputValue);
    }
  };

  const suggestions = PREDEFINED_CATEGORIES.filter(c => !categoriesList.includes(c));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Campaign Categories</label>
        <span className="text-[10px] font-bold text-blue-400">Optional</span>
      </div>

      {/* Active Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        {categoriesList.map(cat => (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={cat}
            className="flex items-center gap-1.5 bg-white text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm group hover:border-red-200 hover:text-red-500 transition-all cursor-default"
          >
            {cat}
            <button
              onClick={() => handleRemoveCategory(cat)}
              className="text-gray-300 group-hover:text-red-500 transition-colors ml-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.span>
        ))}
        {categoriesList.length === 0 && (
          <p className="text-[10px] text-gray-400 italic flex items-center h-6 px-1">No categories selected</p>
        )}
      </div>

      {/* Suggested Box */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-50">
          <p className="text-[9px] font-black text-blue-400 uppercase mb-2 tracking-widest">Quick Add Suggested</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 10).map(cat => (
              <button
                key={cat}
                onClick={() => handleAddCategory(cat)}
                className="text-[10px] bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg hover:border-blue-300 hover:text-primary hover:shadow-sm transition-all flex items-center gap-1.5 font-semibold text-gray-600 group"
              >
                <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && handleAddCategory(inputValue)}
          placeholder="Type custom & press Enter..."
          className="w-full text-xs font-semibold text-gray-900 bg-white border border-gray-200 rounded-xl px-10 py-3 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 text-[8px] font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded uppercase">Enter</kbd>
        </div>
      </div>
    </div>
  );
}

function SidebarField({ label, value, onChange, error, placeholder, onSpeak, isSpeaking }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
        {onSpeak && (
          <button
            onClick={onSpeak}
            className={`p-1 rounded-lg transition-all ${isSpeaking ? "text-red-500" : "text-gray-400 hover:text-primary"}`}
          >
            <motion.div animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </motion.div>
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 transition-all outline-none ${error
          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
          : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          }`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
      />
      {error && <p className="text-[10px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
