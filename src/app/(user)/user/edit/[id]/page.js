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
import RichTextEditor from "@/components/editor/RichTextEditor";

const STANDARD_FOOTER = `
<div style='margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;'>
  <h4 style='text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;'>Media Contact</h4>
  <p style='margin:0;font-weight:700;color:#111827;'>Drop PR AI Research & Media Desk</p>
  <p style='margin:4px 0;color:#4b5563;'>support@droppr.ai</p>
  <p style='margin:4px 0;color:#4b5563;'>Austin, Texas</p>
</div>
<div style='margin-top:2.5rem;padding:1.5rem;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;'>
  <h4 style='margin-top:0;color:#111827;'>About Drop PR</h4>
  <p style='margin-bottom:1rem;color:#374151;line-height:1.7;'><a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a> transforms creator videos, podcasts, product reviews, and brand announcements into professionally written editorial-style articles distributed across a broad network of digital publishers. The platform helps brands, creators, agencies, and e-commerce companies expand search visibility, strengthen AI discoverability, generate backlinks, and extend the lifespan of short-form content beyond social media feeds.</p>
  <h4 style='margin-top:1.5rem;color:#111827;'>Call to Action</h4>
  <p style='margin-bottom:0;color:#374151;line-height:1.7;'>Brands, creators, podcasters, and agencies interested in turning content into distributed editorial coverage can learn more at <a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a>.</p>
</div>
`;

function stripFooter(html) {
  if (!html) return "";
  const footerKeywords = [
    "<div style='margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;'>",
    "<div style=\"margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;\">",
    "<div style='margin-top:3rem;",
    "<div style=\"margin-top:3rem;",
    "<h4>Media Contact</h4>",
    "<h4 style='text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;'>Media Contact</h4>",
    "<h4 style=\"text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;\">Media Contact</h4>",
    "Media Contact",
  ];

  for (const keyword of footerKeywords) {
    const index = html.indexOf(keyword);
    if (index !== -1) {
      let cleanHtml = html.substring(0, index).trim();
      if (cleanHtml.endsWith("<div>")) {
        cleanHtml = cleanHtml.slice(0, -5).trim();
      }
      return cleanHtml;
    }
  }

  return html;
}

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
  const [isSavingManual, setIsSavingManual] = useState(false);
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
  const [videoSource, setVideoSource] = useState(null);

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
            setVideoSource(campaign.videoSource);
            if (campaign.article) {
              let initialBody = campaign.article.body || "";

              // Detect legacy campaigns (segmented text boxes are populated, body has no HTML markup yet)
              const isLegacy = campaign.article.introduction || campaign.article.creatorQuote || campaign.article.conclusion;
              const hasHtml = /<[a-z][\s\S]*>/i.test(initialBody);

              if (isLegacy && !hasHtml) {
                // Perform dynamic premium migration stitch
                const dateline = campaign.article.locationDate ? `<strong>${campaign.article.locationDate.toUpperCase()} — </strong>` : "";
                let htmlContent = "";

                if (campaign.article.introduction) {
                  htmlContent += `<p>${dateline}${campaign.article.introduction}</p>`;
                } else if (dateline) {
                  htmlContent += `<p>${dateline}</p>`;
                }

                if (initialBody) {
                  htmlContent += `<p>${initialBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
                }

                if (campaign.article.creatorQuote) {
                  const quoteAuthor = campaign.productCard?.authorName || campaign.productCard?.creatorAttribution || "Independent Creator";
                  htmlContent += `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #374151;">
                    <p style="font-size: 1.1rem; line-height: 1.6;">"${campaign.article.creatorQuote}"</p>
                    <footer style="margin-top: 0.75rem; font-weight: 700; font-style: normal; color: #111827;">— ${quoteAuthor}</footer>
                  </blockquote>`;
                }

                if (campaign.article.conclusion) {
                  htmlContent += `<p>${campaign.article.conclusion}</p>`;
                }

                // Append Media Contact Footer
                const authorText = campaign.productCard?.authorName || campaign.productCard?.creatorAttribution || user?.name || "Media Relations Department";
                const userEmail = user?.email || "press@droppr.ai";
                htmlContent += `
                  <div style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #f3f4f6;">
                    <h4 style="text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Media Contact:</h4>
                    <p style="margin: 0; font-weight: 700; color: #111827;">${authorText}</p>
                    <p style="margin: 4px 0; color: #4b5563;">${userEmail}</p>
                    <p style="margin: 0; color: #9ca3af; font-size: 0.75rem;">Source: Drop PR AI Newsroom Network</p>
                  </div>
                `;

                initialBody = `<div>${htmlContent}</div>`;
              }

              setEditData({
                headline: campaign.article.headline || "",
                locationDate: "",
                introduction: "",
                body: initialBody,
                productSummary: campaign.article.productSummary || {
                  category: "",
                  useCase: "",
                  positioning: "",
                },
                ctaText: "",
                conclusion: "",
                creatorQuote: "",
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
          locationDate: "",
          introduction: "",
          body: response.data.article.body || "",
          productSummary: response.data.article.productSummary || prev.productSummary,
          ctaText: "",
          conclusion: "",
          creatorQuote: "",
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

  const handleManualSave = async () => {
    setIsSavingManual(true);
    try {
      const { campaignService } = await import("@/lib/api/user/campaigns");
      const payload = {
        article: editData,
        productCard: productCard,
        context: context,
        saveAsVersion: true
      };

      const response = await campaignService.updateCampaign(campaignId, payload);
      if (response.success) {
        setLastSaved(new Date());
        if (response.data.versions) {
          setVersions(response.data.versions);
        }
        setInitialData(JSON.stringify({
          data: response.data.article || editData,
          product: response.data.productCard || productCard,
          ctx: response.data.context || context
        }));
        toast.success("Manual changes saved & new version created!", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        toast.error(response.message || "Save failed");
      }
    } catch (error) {
      console.error("Manual save failed:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsSavingManual(false);
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

      // Use the unified WYSIWYG body content directly
      let htmlContent = "";
      if (editData.body) {
        const containsHTML = /<[a-z][\s\S]*>/i.test(editData.body);
        if (containsHTML) {
          htmlContent = stripFooter(editData.body.trim());
        } else {
          // Fallback plain text formatting
          htmlContent = stripFooter(`<p>${editData.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`);
        }
      }

      // 1. Build the Creator Quote HTML if it exists
      let creatorQuoteHtml = "";
      if (editData.creatorQuote) {
        creatorQuoteHtml = `
          <div style="padding: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin: 30px 0; text-align: center;">
            <p style="font-style: italic; font-size: 1.25rem; color: #1f2937; line-height: 1.6; margin: 0 0 8px 0;">"${editData.creatorQuote}"</p>
            ${productCard.authorName ? `<p style="font-size: 0.875rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">From ${productCard.authorName}</p>` : ""}
          </div>
        `;
      }

      // 2. Build the Purchase Information HTML block (uses objective, non-promotional terms to maximize AI quality score)
      const purchaseInfoHtml = `
        <div style="margin-top: 30px; padding-top: 20px;">
          <h4 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Product Sourcing & Availability</h4>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #4b5563; margin: 0 0 12px 0;">
            Retail pricing, specifications, and regional availability for ${productCard.productName || "this product"} are cataloged on the official retail platform.
          </p>
          <div style="margin-top: 10px;">
            <p style="font-size: 0.8rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">Reference Listing:</p>
            <a href="${productCard.affiliateLink || '#'}" target="_blank" rel="noopener noreferrer" style="color: #0A5CFF; font-weight: 600; text-decoration: underline; font-size: 0.95rem;">
              Official Product Page
            </a>
          </div>
        </div>
      `;

      // 3. Build the Original Source Video link block if it exists
      let originalSourceHtml = "";
      if (videoSource !== "document_upload" && productCard.sourceVideoLink) {
        originalSourceHtml = `
          <div style="margin-top: 24px; padding-top: 16px;">
            <p style="font-size: 0.75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Original Source:</p>
            <a href="${productCard.sourceVideoLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 500; text-decoration: underline; font-size: 1rem;">
              Watch Original Creator Video
            </a>
          </div>
        `;
      }

      // Combine all parts into a clean runtime HTML content payload
      const wrappedContent = `
        <div>
          ${htmlContent}
          ${creatorQuoteHtml}
          ${purchaseInfoHtml}
          ${originalSourceHtml}
          ${STANDARD_FOOTER}
        </div>
      `;

      const summary = editData.summary || "Press Release Summary";
      const image = productCard.thumbnail || "";
      const author = productCard.authorName || currentUser?.name || currentUser?.firstName || "Press Services";
      const categoriesArray = editData.categories
        ? editData.categories.split(",").map(c => c.trim()).filter(c => c)
        : [];

      const xprStoryPayload = {
        title: headline,
        summary: summary,
        content: wrappedContent || "<div>No Content</div>",
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

      if (aiAnalysisData) {
        console.log(`[Frontend AI Score] ${aiAnalysisData.score}/100 - Classification: ${aiAnalysisData.classification}`);
        console.log(`[Frontend AI Summary] ${aiAnalysisData.summary}`);
      }

      const isSuccess = response?.data?.success !== false;
      const isGoodScore = aiAnalysisData && aiAnalysisData.score >= 60;

      if (isSuccess && isGoodScore) {
        // Score is good, proceed directly to publish modal
        handleInitiatePublish();
      } else {
        // Score is low or filters failed, show the AI improvement modal
        setShowAiScoreSheet(true);
        if (aiAnalysisData && aiAnalysisData.score < 60) {
          toast.warn("SEO Quality Score is too low for publication. Please improve the content.");
        } else if (!isSuccess) {
          toast.warn("Validation failed. Please review improvement suggestions.");
        }
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
        // toast.info("No releases available. Redirecting to pricing...");
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
    !editData.summary?.trim() ||
    !editData.body?.trim() ||
    !productCard.productName?.trim() ||
    !productCard.thumbnail?.trim() ||
    !productCard.affiliateLink?.trim() ||
    !productCard.authorName?.trim() ||
    (videoSource !== "document_upload" && !productCard.sourceVideoLink?.trim()) ||
    !isValidUrl(productCard.thumbnail) ||
    !isValidUrl(productCard.affiliateLink) ||
    (videoSource !== "document_upload" && !isValidUrl(productCard.sourceVideoLink)) ||
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
    <div className="min-h-screen bg-white sm:bg-gray-50 pb-20">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 max-w-[40%] sm:max-w-none">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base md:text-xl font-bold text-gray-900 hidden xs:block">Editor</h1>
          <div className="h-4 w-px bg-gray-200 hidden xs:block"></div>
          <div className="text-[10px] md:text-xs text-gray-500 truncate">
            {lastSaved ? `${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Ready"}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={handleManualSave}
            disabled={isSavingManual || isLimitReached}
            className={`p-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${isLimitReached
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md disabled:bg-blue-400 disabled:shadow-none"
              }`}
            title="Save Changes as Version"
          >
            {isSavingManual ? (
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            <span>{isSavingManual ? "Saving..." : "Save"}</span>
          </button>

          <button
            onClick={() => setShowVersions(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200"
            title="History"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Versions ({versions.length})</span>
            <span className="sm:hidden">({versions.length})</span>
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="p-1.5 sm:px-4 sm:py-1.5 text-xs font-semibold text-primary hover:bg-blue-50 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </nav>

      <div className="w-full px-0 sm:px-4 py-3 md:py-8">
        {/* Limit Warning Banner */}
        {isLimitReached && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">!</div>
            <div>
              <h4 className="text-red-800 font-bold text-xs">Maximum edits limit reached.</h4>
              <p className="text-red-600 text-[10px]">Article content is locked. You can still update the Product Card.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

          {/* Main Editor Section */}
          <div className={`lg:col-span-8 space-y-4 md:space-y-6 ${isLimitReached ? "pointer-events-none" : ""}`}>

            {/* Campaign Context Chips */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] sm:text-xs font-bold text-blue-600 tracking-tight">Campaign-Aware Edits</span>
                <div className="h-1 w-1 bg-blue-300 rounded-full"></div>
                <span className="text-[9px] text-blue-400">Context active</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(context).map(([key, value]) => (
                  <div key={key} className="flex items-center bg-white border border-blue-200 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1 gap-1.5 shadow-sm relative group/chip transition-all hover:border-blue-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-100 min-w-[120px] sm:min-w-[140px]">
                    <select
                      value={value}
                      onChange={(e) => setContext({ ...context, [key]: e.target.value })}
                      className="w-full text-[11px] sm:text-xs font-bold text-blue-600 bg-transparent border-none focus:ring-0 p-0 pr-6 appearance-none cursor-pointer outline-none"
                      disabled={isLimitReached || regenerating}
                    >
                      {contextOptions[key].map(opt => <option key={opt} value={opt} className="text-gray-900 font-medium">{opt}</option>)}
                    </select>
                    <svg className="w-3 h-3 text-blue-400 absolute right-2.5 pointer-events-none transition-transform group-focus-within/chip:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ))}
                <button
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={regenerating || isLimitReached}
                  className="ml-auto bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-lg hover:bg-blue-600 shadow-sm disabled:bg-gray-400 transition-all"
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
                <AutoGrowingTextarea
                  value={editData.headline}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                  className="w-full text-base sm:text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300 disabled:text-gray-400 outline-none leading-tight selection:bg-blue-100 overflow-hidden"
                  placeholder="Headline..."
                />
              </SectionCard>



              {/* Summary Section (Required by XPR Media) */}
              <SectionCard
                label="Press Release Summary"
                disabled={isLimitReached}
                onSpeak={() => toggleSpeech(editData.summary, 'summary')}
                isSpeaking={currentlySpeaking === 'summary'}
              >
                <AutoGrowingTextarea
                  value={editData.summary}
                  disabled={isLimitReached}
                  onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  maxLength={250}
                  className="w-full text-[11px] sm:text-sm text-gray-700 leading-snug border-none focus:ring-0 p-0 resize-none disabled:text-gray-400 overflow-hidden outline-none"
                  placeholder="Concise summary..."
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] ${editData.summary?.length > 200 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {editData.summary?.length || 0} / 250
                  </span>
                </div>
              </SectionCard>

              {/* HTML Press Release Content */}
              <SectionCard
                label="HTML Article Body"
                disabled={isLimitReached}
                onAiAction={() => handleRegenerate("IMPROVE_NARRATIVE_FLOW")}
                aiLabel={regenerating && regeneratingAction === "IMPROVE_NARRATIVE_FLOW" ? "Improving..." : "Improve Narrative Flow"}
                aiDisabled={regenerating}
                secondaryAction={() => handleRegenerate("CONDENSE_BODY")}
                secondaryLabel={regenerating && regeneratingAction === "CONDENSE_BODY" ? "Condensing..." : "Condense Body"}
                secondaryDisabled={headlineRegenerated || regenerating}
                onSpeak={() => {
                  const plainText = editData.body ? editData.body.replace(/<[^>]*>/g, '') : '';
                  toggleSpeech(plainText, 'body');
                }}
                isSpeaking={currentlySpeaking === 'body'}
              >
                <div className="mt-2 min-h-[400px]">
                  <RichTextEditor
                    value={editData.body}
                    onChange={(html) => setEditData(prev => ({ ...prev, body: html }))}
                    placeholder="Write your beautiful HTML press release body..."
                    maxLength={12000}
                  />

                  {/* Read-only Static News Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-200 text-left opacity-85">
                    <div className="mb-6">
                      <h4 className="text-xs uppercase font-extrabold text-gray-500 tracking-wider mb-2">Media Contact</h4>
                      <p className="text-sm font-bold text-gray-900">Drop PR AI Research & Media Desk</p>
                      <p className="text-xs text-gray-600">support@droppr.ai</p>
                      <p className="text-xs text-gray-500">Austin, Texas</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 mb-1">About Drop PR</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">
                        <a href="https://droppr.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-700">Drop PR</a> transforms creator videos, podcasts, product reviews, and brand announcements into professionally written editorial-style articles distributed across a broad network of digital publishers. The platform helps brands, creators, agencies, and e-commerce companies expand search visibility, strengthen AI discoverability, generate backlinks, and extend the lifespan of short-form content beyond social media feeds.
                      </p>
                      <h4 className="text-xs font-bold text-gray-900 mb-1 mt-3">Call to Action</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Brands, creators, podcasters, and agencies interested in turning content into distributed editorial coverage can learn more at <a href="https://droppr.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline hover:text-blue-700">Drop PR</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Sidebar / Sidebar Cards */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-4 py-2.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Mandatory Product Card
                </h3>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
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

                {videoSource !== "document_upload" && (
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
                )}

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
                    disabled={isPublishDisabled || validating || regenerating}
                    onClick={handlePublishClick}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex justify-center items-center gap-2 ${isPublishDisabled || validating || regenerating
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-600 to-primary text-white hover:shadow-lg focus:ring-4 focus:ring-blue-100"
                      }`}
                  >
                    {regenerating ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                        Regenerating...
                      </>
                    ) : validating ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Validating...
                      </>
                    ) : (
                      "Validate Now"
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
              className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 sm:border-4 ${aiAnalysis.score >= 90 ? "bg-green-100 text-green-600 border-green-200" :
                    aiAnalysis.score >= 80 ? "bg-blue-100 text-blue-600 border-blue-200" :
                      "bg-amber-100 text-amber-600 border-amber-200"
                    }`}>
                    {aiAnalysis.score}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-lg">SEO Score</h3>
                    <p className="text-[9px] text-gray-500 font-bold tracking-tight">SEO Quality Analysis</p>
                  </div>
                </div>
                <button onClick={() => setShowAiScoreSheet(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
                {/* AI Improvement Suggestions */}
                {aiAnalysis.improvementSuggestions && aiAnalysis.improvementSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      SEO Improvement Suggestions (Actionable)
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.improvementSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <span className="text-red-500 font-bold mt-0.5">•</span>
                          <span className="text-xs sm:text-sm text-gray-800 font-semibold leading-relaxed">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiAnalysis.suggestedEdits && aiAnalysis.suggestedEdits.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Improvement Suggestions
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.suggestedEdits.map((edit, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50/30 border border-amber-100/50 rounded-lg">
                            <span className="text-amber-500 font-bold mt-0.5">•</span>
                            <span className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">{edit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Score Meaning */}
                <div className={`rounded-lg p-4 sm:p-5 border-2 ${aiAnalysis.score < 60 ? "bg-red-50 border-red-200" : "bg-blue-50/50 border-blue-100"
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold text-gray-400">Analysis Summary</span>
                    {aiAnalysis.score < 60 && <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">IMPROVEMENT REQUIRED</span>}
                  </div>
                  <p className={`text-sm sm:text-[15px] leading-relaxed font-bold ${aiAnalysis.score < 60 ? "text-red-900" : "text-blue-900 italic"}`}>
                    {aiAnalysis.score < 60
                      ? `Publish Blocked: Your SEO Score is ${aiAnalysis.score}/100. SEO standards require a minimum score of 60.`
                      : `"${aiAnalysis.summary || "Your article meets the quality standards for publication."}"`
                    }
                  </p>
                  {aiAnalysis.summary && aiAnalysis.score < 60 && (
                    <p className="mt-3 text-xs sm:text-sm text-red-700 font-medium leading-relaxed bg-white/50 p-3 rounded-lg border border-red-100">
                      <strong>Focus:</strong> {aiAnalysis.summary}
                    </p>
                  )}
                </div>

                {/* Classification Check */}
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-white border border-gray-100 rounded-lg">
                  <div className={`px-2 py-0.5 rounded text-[9px] font-bold ${aiAnalysis.classification === 'PRESS_RELEASE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {aiAnalysis.classification?.replace('_', ' ') || 'ANALYZING'}
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">Classification</span>
                </div>

                {/* Technical Validation Details / Raw Errors */}
                {aiAnalysis.failedFilters && aiAnalysis.failedFilters.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Technical Validation Details
                    </h4>
                    <div className="space-y-1">
                      {aiAnalysis.failedFilters.map((filter, idx) => (
                        <div key={idx} className="text-xs text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-md border border-gray-100/50">
                          {filter}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowAiScoreSheet(false)}
                  className="text-xs sm:text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Edit
                </button>
                <div className="flex gap-2 sm:gap-3">
                  {aiAnalysis.score < 60 && (
                    <button
                      disabled={regenerating}
                      onClick={async () => {
                        setShowAiScoreSheet(false);
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
                            toast.success("AI significantly improved your content!");
                          }
                        } catch (e) {
                          console.error(e);
                          toast.error("AI improvement failed.");
                        } finally {
                          setRegenerating(false);
                          setRegeneratingAction(null);
                        }
                      }}
                      className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                      {regenerating ? "Improving..." : "Improve with AI"}
                    </button>
                  )}
                  {aiAnalysis.score >= 60 && (
                    <button
                      onClick={handleInitiatePublish}
                      className="bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
                    >
                      Publish
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
              className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                <h3 className="font-bold text-gray-900 text-lg">Validation Failed</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please correct the following issues:
                </p>
                <ul className="space-y-2">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  Close
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
              className="relative bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-900 text-sm">Previous Versions</h3>
                <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {versions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">No versions saved yet</div>
                ) : (
                  versions.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => handleRestore(v)}
                      className="w-full text-left px-5 py-3 hover:bg-blue-50 border-b border-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">Version {versions.length - i}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{new Date(v.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 font-bold transition-opacity">Restore</span>
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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group transition-opacity ${disabled ? "opacity-75" : ""}`}>
      <div className="bg-gray-50/50 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 tracking-tight">{label}</span>
          {onSpeak && (
            <button
              onClick={onSpeak}
              className={`p-1 rounded-md transition-all ${isSpeaking ? "bg-red-50 text-red-500" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}
              title={isSpeaking ? "Stop" : "Listen"}
            >
              <motion.div animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </motion.div>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {onAiAction && (
            <button
              onClick={onAiAction}
              disabled={disabled || aiDisabled}
              className="bg-white border border-blue-100 text-primary text-[9px] font-bold px-2.5 py-1 rounded-lg hover:bg-blue-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              disabled={disabled || secondaryDisabled}
              className="bg-white border border-gray-100 text-gray-600 text-[9px] font-bold px-2.5 py-1 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
      <div className={`px-3 py-2.5 sm:px-5 sm:py-3 ${disabled ? "pointer-events-none select-none" : ""}`}>{children}</div>
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-400">Campaign Categories</label>
        <span className="text-[10px] font-bold text-blue-400">Optional</span>
      </div>

      {/* Active Tags Display */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
        {categoriesList.map(cat => (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={cat}
            className="flex items-center gap-1 bg-white text-primary text-[10px] font-bold px-2 py-1 rounded-md border border-blue-100 shadow-sm group hover:border-red-200 hover:text-red-500 transition-all cursor-default"
          >
            {cat}
            <button
              onClick={() => handleRemoveCategory(cat)}
              className="text-gray-300 group-hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
        {categoriesList.length === 0 && (
          <p className="text-[10px] text-gray-400 italic flex items-center h-6 px-1">No categories selected</p>
        )}
      </div>

      {/* Suggested Box */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-50/50">
          <p className="text-[9px] font-bold text-blue-400 mb-2 tracking-tight">Suggested</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 10).map(cat => (
              <button
                key={cat}
                onClick={() => handleAddCategory(cat)}
                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md hover:border-blue-300 hover:text-primary hover:shadow-sm transition-all flex items-center gap-1 font-semibold text-gray-600 group"
              >
                <svg className="w-2.5 h-2.5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          placeholder="New category..."
          className="w-full text-xs font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-9 py-2 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 transition-all outline-none"
        />
      </div>
    </div>
  );
}

function SidebarField({ label, value, onChange, error, placeholder, onSpeak, isSpeaking }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-400">{label}</label>
        {onSpeak && (
          <button
            onClick={onSpeak}
            className={`p-1 rounded-md transition-all ${isSpeaking ? "text-red-500" : "text-gray-400 hover:text-primary"}`}
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
        className={`w-full text-xs font-semibold text-gray-900 bg-gray-50/50 border rounded-lg px-3 py-2 sm:py-2.5 focus:bg-white focus:ring-1 transition-all outline-none ${error
          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
          : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          }`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
      />
      {error && <p className="text-[10px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}

// Helper component for auto-growing textareas
function AutoGrowingTextarea({ value, onChange, className, placeholder, disabled, maxLength }) {
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={className}
    />
  );
}
