"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import PreviewPublishModal from "@/components/user/PreviewPublishModal";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import userAuthStore from "@/store/userAuthStore";

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

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidated, setIsValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [xprStoryPayload, setXprStoryPayload] = useState(null);

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
      if (editData.introduction) htmlContent += `<p>${editData.introduction}</p>`;
      if (editData.body) htmlContent += `<p>${editData.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
      if (editData.creatorQuote) {
        htmlContent += `<blockquote><p>"${editData.creatorQuote}"</p>`;
        if (productCard.authorName) {
          htmlContent += `<footer>— ${productCard.authorName}</footer>`;
        }
        htmlContent += `</blockquote>`;
      }
      if (productCard.productName) {
        htmlContent += `<h3>Featured Product: ${productCard.productName}</h3>`;
        if (productCard.thumbnail) {
          htmlContent += `<img src="${productCard.thumbnail}" alt="${productCard.productName}" />`;
        }
        if (productCard.affiliateLink) {
          htmlContent += `<p>Product Page: <a href="${productCard.affiliateLink}">${productCard.affiliateLink}</a></p>`;
        }
        if (productCard.sourceVideoLink) {
          htmlContent += `<p>Original Source: <a href="${productCard.sourceVideoLink}">${productCard.sourceVideoLink}</a></p>`;
        }
      }
      if (editData.conclusion) htmlContent += `<p>${editData.conclusion}</p>`;

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

      // response format from backend: { success: true, data: { success: false, failedFilters: [], aiAnalysis: {} } }
      const isBackendSuccess = response?.success;
      const isXprSuccess = response?.data?.success;

      if (!isBackendSuccess || !isXprSuccess) {
        const errMsgs = [];
        const xprData = response?.data;

        if (response?.message && !xprData) {
          errMsgs.push(response.message);
        } else if (xprData) {
          if (xprData.error) errMsgs.push(xprData.error);
          if (xprData.failedFilters?.length) errMsgs.push(...xprData.failedFilters.map(f => `Filter Failed: ${f}`));
          if (xprData.aiAnalysis?.summary) errMsgs.push(`AI Feedback: ${xprData.aiAnalysis.summary}`);
        }

        setValidationErrors(errMsgs.length ? errMsgs : ["Unknown validation error from XPR Media."]);
        setShowValidationModal(true);
        setValidating(false);
        return; // Stop publish flow if invalid
      }

      // Validation passed, proceed to publish checks
      const hasCredits = (currentUser?.planCredits || []).some(pc => pc.remainingArticles > 0);

      if (hasCredits) {
        setShowPublishModal(true);
      } else {
        toast.info("No releases available. Redirecting to pricing...");
        router.push(`/user/pricing/${campaignId}`);
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
    !isValidUrl(productCard.sourceVideoLink);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
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
          <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>
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
            className="p-1 sm:p-2 md:px-4 md:py-2 text-sm font-medium text-[#0A5CFF] hover:bg-blue-50 rounded-lg flex items-center gap-2"
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
            <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">!</div>
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
                  onClick={() => handleRegenerate("REWRITE_WITH_CONTEXT")}
                  disabled={regenerating || isLimitReached}
                  className="ml-auto bg-[#0A5CFF] text-white text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-blue-600 shadow-md shadow-blue-100 disabled:bg-gray-400"
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
                  {productCard.authorName && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Attributed to:</span>
                      <span className="text-[10px] font-bold text-[#0A5CFF]">{productCard.authorName}</span>
                    </div>
                  )}
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
              <SectionCard label="Conclusion" disabled={isLimitReached}>
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
              >
                <div className="flex flex-col gap-4">
                  <input
                    value={editData.ctaText}
                    disabled={isLimitReached}
                    onChange={(e) => setEditData({ ...editData, ctaText: e.target.value })}
                    className="w-full text-[12px] sm:text-[15px] font-bold text-[#0A5CFF] border border-blue-100 rounded-lg p-2 sm:p-3 bg-blue-50/20 disabled:text-blue-300 disabled:border-gray-100 disabled:bg-gray-50"
                    placeholder="Buy [Product Name] Today..."
                  />
                  <div className="p-2 sm:p-4 text-[15px] sm:text-normal rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center">
                    <button className="px-6 py-2 bg-[#0A5CFF] text-white font-bold rounded shadow-md pointer-events-none opacity-50">
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
                <SidebarField label="Product Name" value={productCard.productName} onChange={(val) => setProductCard({ ...productCard, productName: val })} />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Thumbnail URL</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-[10px] font-bold ${uploadingThumbnail ? "text-gray-400" : "text-[#0A5CFF] hover:underline"}`}
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
                      setThumbnailUrlError(val && !isValidUrl(val) ? "Please enter a valid URL (e.g. https://...)" : "");
                    }}
                    className={`w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 transition-all outline-none ${thumbnailUrlError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"}`}
                    placeholder="https://..."
                  />
                  {thumbnailUrlError && <p className="text-[10px] text-red-500 font-medium mt-1">{thumbnailUrlError}</p>}
                  {productCard.thumbnail && !thumbnailUrlError && (
                    <div className="mt-2 w-[100px] h-[100px] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
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
                />
                <SidebarField label="Author Name" value={productCard.authorName} onChange={(val) => setProductCard({ ...productCard, authorName: val })} />

                <SidebarField
                  label="Source Video Link"
                  value={productCard.sourceVideoLink}
                  onChange={(val) => {
                    setProductCard({ ...productCard, sourceVideoLink: val });
                    setSourceLinkError(val && !isValidUrl(val) ? "Please enter a valid URL (e.g. https://...)" : "");
                  }}
                  error={sourceLinkError}
                  placeholder="https://..."
                />

                <SidebarField
                  label="Categories (comma separated)"
                  value={editData.categories}
                  onChange={(val) => setEditData({ ...editData, categories: val })}
                  placeholder="e.g. Technology, Health, Startups"
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
                      : "bg-gradient-to-r from-blue-600 to-[#0A5CFF] text-white hover:shadow-lg focus:ring-4 focus:ring-blue-100"
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

      {/* Preview Modal */}
      <FullArticlePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
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
                      <span className="text-xs text-[#0A5CFF] opacity-0 group-hover:opacity-100 font-bold transition-opacity">Restore</span>
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

function SectionCard({ label, children, onAiAction, aiLabel, aiDisabled, secondaryAction, secondaryLabel, secondaryDisabled, disabled }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group transition-opacity ${disabled ? "opacity-75" : ""}`}>
      <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <div className="flex gap-2">
          {onAiAction && (
            <button
              onClick={onAiAction}
              disabled={disabled || aiDisabled}
              className="bg-white border border-blue-200 text-[#0A5CFF] text-[9px] sm:text-[10px] font-bold px-1 sm:px-3 py-1 rounded-full hover:bg-blue-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

function SidebarField({ label, value, onChange, error, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 transition-all outline-none ${error
          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
          : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          }`}
      />
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
