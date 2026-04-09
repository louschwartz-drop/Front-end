import api from "@/lib/api/axios";

/**
 * Utility to download campaign articles (PDF/Word) using Axios
 * to ensure auth tokens are included and no page redirects occur.
 * 
 * @param {string} campaignId - The ID of the campaign
 * @param {string} format - 'pdf' or 'word'
 * @param {string} defaultFilename - Optional filename to save as
 */
export const downloadCampaignFile = async (campaignId, format, defaultFilename = null) => {
    try {
        const url = `/user/campaigns/${campaignId}/download/${format}`;
        
        const response = await api.get(url, {
            responseType: 'blob', // Critical for handling binary file data
        });

        // Create a blob URL from the response
        const blob = new Blob([response.data], { 
            type: format === 'pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Determine filename
        const filename = defaultFilename || `article-${campaignId}.${format === 'pdf' ? 'pdf' : 'docx'}`;

        // Trigger download using a hidden anchor tag
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        return { success: true };
    } catch (error) {
        console.error(`Error downloading ${format}:`, error);
        throw error;
    }
};
