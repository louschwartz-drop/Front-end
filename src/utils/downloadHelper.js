import api from "@/lib/api/axios";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";

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

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${displayData.headline || "Press Release"}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #111827; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
        @media print {
            body { padding: 15mm; }
            @page { margin: 15mm; size: A4; }
        }
    </style>
</head>
<body>
    <h1>${displayData.headline || "Press Release"}</h1>
    ${displayData.summary ? `<div class="summary">${displayData.summary}</div>` : ""}
    ${productBlock}
    <div class="body-content">
        ${stripFooter(displayData.body || "")}
        ${standardFooter}
    </div>
    <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 600); };
    </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups for this site to download PDF.");
        return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
};
