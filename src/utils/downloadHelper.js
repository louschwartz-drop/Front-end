import api from "@/lib/api/axios";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";
import html2pdf from "html2pdf.js";

/**
 * Utility to download campaign articles (Word) using Axios
 * to ensure auth tokens are included and no page redirects occur.
 */
export const downloadCampaignFile = async (campaignId, format, defaultFilename = null) => {
    try {
        const url = `/user/campaigns/${campaignId}/download/${format}`;
        
        const response = await api.get(url, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { 
            type: format === 'pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const blobUrl = window.URL.createObjectURL(blob);
        const filename = defaultFilename || `article-${campaignId}.${format === 'pdf' ? 'pdf' : 'docx'}`;

        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        return { success: true };
    } catch (error) {
        console.error(`Error downloading ${format}:`, error);
        throw error;
    }
};

/**
 * Client-side PDF generation via browser print window.
 * Opens the article HTML in a new window and triggers window.print().
 * The browser handles PDF natively (File → Save as PDF) — no Puppeteer needed.
 * Pixel-perfect match to the FullArticlePreview modal.
 */
export const printArticleAsPdf = ({ displayData, displayProduct, standardFooter, stripFooter }) => {
    const categories = (displayData.categories || displayData.productSummary?.category || "")
        .split(",").map(c => c.trim()).filter(Boolean);

    const productBlock = `
        <div class="product-card">
            <span class="product-label">Featured Product</span>
            <div class="product-inner">
                ${displayProduct.thumbnail ? `<img src="${displayProduct.thumbnail}" alt="Product" class="product-thumb" />` : ""}
                <div>
                    <h4 class="product-name">${displayProduct.productName || "Product"}</h4>
                    ${categories.length ? `<div class="categories">${categories.map(c => `<span class="tag">${c}</span>`).join("")}</div>` : ""}
                    ${displayData.productSummary?.useCase ? `<p class="meta"><b>Use case:</b> ${displayData.productSummary.useCase}</p>` : ""}
                    ${displayData.productSummary?.positioning ? `<p class="meta"><b>Positioning:</b> ${displayData.productSummary.positioning}</p>` : ""}
                </div>
            </div>
        </div>`;

    const htmlContent = `
        <div class="pdf-container">
            <h1>${displayData.headline || "Press Release"}</h1>
            ${displayData.summary ? `<div class="summary">${displayData.summary}</div>` : ""}
            ${productBlock}
            <div class="body-content">
                ${stripFooter(displayData.body || "")}
                ${standardFooter}
            </div>
        </div>
    `;

    // Create a temporary container
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    // Add inline styles directly to the element to ensure html2pdf catches them
    const style = document.createElement('style');
    style.innerHTML = `
        .pdf-container { font-family: 'Inter', sans-serif; color: #111827; background: #fff; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 2rem; font-weight: 800; line-height: 1.2; margin-bottom: 1.25rem; }
        .summary { border-left: 4px solid #0A5CFF; padding: 8px 16px; font-style: italic; font-weight: 600; color: #1f2937; background: #f9fafb; margin-bottom: 1.5rem; }
        .product-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin: 1.5rem 0; }
        .product-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; display: block; margin-bottom: 12px; }
        .product-inner { display: flex; gap: 20px; align-items: flex-start; }
        .product-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
        .product-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .categories { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .tag { background: #eff6ff; color: #0A5CFF; font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid #bfdbfe; }
        .meta { font-size: 0.8rem; color: #4b5563; margin-top: 4px; }
        .body-content { font-size: 1rem; line-height: 1.8; color: #374151; margin-top: 1.5rem; }
        .body-content p { margin-bottom: 1rem; }
        ${BLOCKQUOTE_STYLES}
    `;
    element.appendChild(style);

    const safeFilename = displayData.headline 
        ? displayData.headline.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() 
        : 'article';

    const opt = {
        margin:       15,
        filename:     `article-${safeFilename}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return html2pdf().set(opt).from(element).save();
};
