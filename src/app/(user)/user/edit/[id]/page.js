"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingAction, setRegeneratingAction] = useState(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [initialData, setInitialData] = useState(null);

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
  });

  const [productCard, setProductCard] = useState({
    productName: "",
    thumbnail: "",
    affiliateLink: "",
    creatorAttribution: "",
    sourceVideoLink: "",
  });

  const [context, setContext] = useState({
    tone: "Informative",
    goal: "Awareness",
    publisherTier: "Standard",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);

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
              });
            }
            if (campaign.productCard) {
              setProductCard({
                productName: campaign.productCard.productName || "",
                thumbnail: campaign.productCard.thumbnail || "",
                affiliateLink: campaign.productCard.affiliateLink || "",
                creatorAttribution: campaign.productCard.creatorAttribution || "",
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
        setEditData(response.data.article);
        setVersions(response.data.versions);
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
    setEditData(version.article);
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

  const isPublishDisabled = !productCard.productName || !productCard.affiliateLink || !editData.ctaText;

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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-2 sm:px-4 py-3 flex items-center justify-between shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Editor</h1>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="text-[10px] sm:text-xs text-gray-500">
            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Ready"}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setShowVersions(true)}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden xs:inline">Versions</span> ({versions.length})
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary hover:bg-blue-50 rounded-lg"
          >
            <span className="hidden sm:inline">Preview Look</span>
            <span className="sm:hidden">Preview</span>
          </button>
          <button
            disabled={isPublishDisabled}
            onClick={() => router.push(`/user/pricing/${campaignId}`)}
            className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${isPublishDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-200"
              }`}
          >
            Publish
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
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
                      disabled={isLimitReached}
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
              >
                <input
                  value={editData.headline}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                  className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300 disabled:text-gray-400"
                  placeholder="Newsworthy headline..."
                />
              </SectionCard>

              {/* Location/Date Section */}
              <SectionCard label="Location | Date" disabled={isLimitReached}>
                <input
                  value={editData.locationDate}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, locationDate: e.target.value })}
                  className="w-full text-sm font-semibold text-gray-500 border-none focus:ring-0 p-0 disabled:text-gray-300"
                  placeholder="Austin, TX | January 28, 2026"
                />
              </SectionCard>

              {/* Lede Section */}
              <SectionCard
                label="Lede (Introduction)"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("EXPAND_LEDE")}
                aiLabel={regenerating && regeneratingAction === "EXPAND_LEDE" ? "Expanding..." : "Expand Lede"}
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

              {/* Creator Quote Section */}
              <SectionCard label="Creator Quote" disabled={isLimitReached}>
                <textarea
                  value={editData.creatorQuote}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, creatorQuote: e.target.value })}
                  rows={2}
                  className="w-full text-gray-700 border-none focus:ring-0 p-0 resize-none italic font-serif disabled:text-gray-400"
                  placeholder="An authentic quote from the video..."
                />
              </SectionCard>

              {/* Body Content Section */}
              <SectionCard
                label="Main Body"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("IMPROVE_NARRATIVE_FLOW")}
                aiLabel={regenerating && regeneratingAction === "IMPROVE_NARRATIVE_FLOW" ? "Improving..." : "Improve Narrative Flow"}
                secondaryAction={() => handleRegenerate("CONDENSE_BODY")}
                secondaryLabel={regenerating && regeneratingAction === "CONDENSE_BODY" ? "Condensing..." : "Condense Body"}
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
              >
                <div className="flex flex-col gap-4">
                  <input
                    value={editData.ctaText}
                    disabled={isLimitReached}
                    onChange={(e) => setEditData({ ...editData, ctaText: e.target.value })}
                    className="w-full font-bold text-[#0A5CFF] border border-blue-100 rounded-lg p-3 bg-blue-50/20 disabled:text-blue-300 disabled:border-gray-100 disabled:bg-gray-50"
                    placeholder="Buy [Product Name] Today..."
                  />
                  <div className="p-4 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center">
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
                    onChange={(e) => setProductCard({ ...productCard, thumbnail: e.target.value })}
                    className="w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 focus:ring-blue-100 focus:border-blue-300 transition-all outline-none"
                    placeholder="https://..."
                  />
                  {productCard.thumbnail && (
                    <div className="mt-2 w-[100px] h-[100px] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                      <img src={productCard.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <SidebarField label="Affiliate Link" value={productCard.affiliateLink} onChange={(val) => setProductCard({ ...productCard, affiliateLink: val })} />
                <SidebarField label="Creator Attribution" value={productCard.creatorAttribution} onChange={(val) => setProductCard({ ...productCard, creatorAttribution: val })} />
                <SidebarField label="Source Video Link" value={productCard.sourceVideoLink} onChange={(val) => setProductCard({ ...productCard, sourceVideoLink: val })} />

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                    <div className="h-5 w-5 text-blue-500 mt-0.5">ℹ️</div>
                    <p className="text-[10px] text-blue-700 leading-normal">
                      Publishing is disabled until Name, Affiliate Link, and CTA are complete. AI edits implicitly reference this card.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPreview(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-12 article-preview"
            >
              <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight">{editData.headline}</h2>
                <p className="text-sm font-bold text-gray-500 border-b border-gray-100 pb-4">{editData.locationDate}</p>

                <div className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">{editData.introduction}</div>

                <div className="text-base sm:text-lg text-gray-700 leading-loose space-y-6 whitespace-pre-wrap">{editData.body}</div>

                {/* Creator Quote Section */}
                {editData.creatorQuote && (
                  <div className="py-6 sm:py-8 border-y border-gray-100 italic text-lg sm:text-xl text-gray-800 text-center leading-relaxed font-serif">
                    "{editData.creatorQuote}"
                  </div>
                )}

                {/* Preview Product Block */}
                <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 my-6 sm:my-10">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Featured Product</span>
                  <div className="flex flex-col sm:flex-row gap-8">
                    {productCard.thumbnail && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
                        <img src={productCard.thumbnail} alt="Product" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-2 min-w-0 flex-1">
                      <h4 className="text-xl font-bold text-gray-900 wrap-break-word">{productCard.productName}</h4>
                      <p className="text-sm text-gray-600">Category: {editData.productSummary?.category}</p>
                      <p className="text-sm text-gray-600">Use case: {editData.productSummary?.useCase}</p>
                      <p className="text-sm text-gray-600">Positioning: {editData.productSummary?.positioning}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase Information</h4>
                  <p className="text-gray-600 italic wrap-break-word">If you've seen the video and wondered whether {productCard.productName} could fit into your own routine, product details, pricing, and availability are available through the official product page.</p>
                  <div className="pt-4 space-y-2 overflow-hidden">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Product Page:</p>
                    <a
                      href={productCard.affiliateLink} target="_blank" rel="noopener noreferrer"
                      className="text-primary underline break-all font-medium block"
                    >
                      {productCard.affiliateLink || "[Affiliate Link]"}
                    </a>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 text-sm text-gray-500 flex flex-col gap-4">
                  <div className="space-y-2 overflow-hidden">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original Source:</p>
                    <a href={productCard.sourceVideoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all block">
                      {productCard.sourceVideoLink || "Watch original creator video"}
                    </a>
                  </div>
                  <p className="wrap-break-word">{productCard.creatorAttribution && `© ${new Date().getFullYear()} ${productCard.creatorAttribution}`}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    </div>
  );
}

function SectionCard({ label, children, onAiAction, aiLabel, secondaryAction, secondaryLabel, disabled }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group transition-opacity ${disabled ? "opacity-75" : ""}`}>
      <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <div className="flex gap-2">
          {onAiAction && (
            <button
              onClick={onAiAction}
              disabled={disabled}
              className="bg-white border border-blue-200 text-[#0A5CFF] text-[10px] font-bold px-3 py-1 rounded-full hover:bg-blue-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              disabled={disabled}
              className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

function SidebarField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2.5 focus:bg-white focus:ring-1 focus:ring-blue-100 focus:border-blue-300 transition-all outline-none"
      />
    </div>
  );
}
