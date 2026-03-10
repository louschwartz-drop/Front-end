// Campaign API service
import api from "../axios";

export const campaignService = {
    // Create a new campaign (Local Upload)
    createCampaign: async (userId, metadata = {}) => {
        const response = await api.post("/user/campaigns", {
            userId,
            videoSource: "local_upload",
            metadata,
        });
        return response.data;
    },

    // Create campaign from social link
    createCampaignFromLink: async (userId, videoUrl) => {
        const response = await api.post("/user/campaigns/link", {
            userId,
            videoUrl,
        });
        return response.data;
    },

    processSocialLink: async (campaignId, clientAudioData = null) => {
        const response = await api.post(`/user/campaigns/${campaignId}/process-social`, clientAudioData || {});
        return response.data;
    },

    // Update video URL after S3 upload
    updateVideoUrl: async (campaignId, videoUrl, videoThumbnail = null) => {
        const response = await api.patch(`/user/campaigns/${campaignId}/video-url`, {
            videoUrl,
            videoThumbnail,
        });
        return response.data;
    },

    // Start transcription process
    startTranscription: async (campaignId) => {
        const response = await api.post(`/user/campaigns/${campaignId}/transcribe`);
        return response.data;
    },

    // Get campaign by ID
    getCampaign: async (campaignId) => {
        const response = await api.get(`/user/campaigns/${campaignId}`);
        return response.data;
    },

    // Get all campaigns for a user
    getUserCampaigns: async (params) => {
        const response = await api.get(`/user/campaigns`, { params });
        return response.data;
    },

    // Update campaign article
    updateCampaign: async (campaignId, updates) => {
        const response = await api.patch(`/user/campaigns/${campaignId}`, updates);
        return response.data;
    },

    // AI Edits
    performAiEdit: async (campaignId, actionId) => {
        const response = await api.post(`/user/campaigns/${campaignId}/ai-edit`, { actionId });
        return response.data;
    },

    // Update Thumbnail (File or URL)
    uploadThumbnail: async (campaignId, data) => {
        // Data can be { thumbnailUrl: "..." } or a FormData object with "thumbnail"
        const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
        const response = await api.patch(`/user/campaigns/${campaignId}/thumbnail`, data, { headers });
        return response.data;
    },

    // Upload Video Targeted at Optimized Flow (with Chunking support)
    uploadOptimized: async (campaignId, file, onUploadProgress) => {
        const CHUNK_SIZE = 1 * 1024 * 1024; // 3MB chunks
        const MAX_SIZE = 4 * 1024 * 1024; // 5MB limit before chunking starts

        if (file.size > MAX_SIZE) {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let lastResponse = null;

            for (let i = 0; i < totalChunks; i++) {
                const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const formData = new FormData();
                formData.append("video", chunk);
                formData.append("chunkIndex", i);
                formData.append("totalChunks", totalChunks);
                formData.append("fileName", file.name);

                lastResponse = await api.post(`/user/campaigns/${campaignId}/upload-optimized`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const chunkProgress = (i / totalChunks) * 100;
                        const individualProgress = (progressEvent.loaded / progressEvent.total) * (100 / totalChunks);
                        if (onUploadProgress) {
                            onUploadProgress(Math.min(99, Math.round(chunkProgress + individualProgress)));
                        }
                    },
                });
            }
            return lastResponse.data;
        } else {
            // Standard single-file upload for small files
            const formData = new FormData();
            formData.append("video", file);
            const response = await api.post(`/user/campaigns/${campaignId}/upload-optimized`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    if (onUploadProgress) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onUploadProgress(percentCompleted);
                    }
                },
            });
            return response.data;
        }
    },

    // Delete campaign
    deleteCampaign: async (campaignId) => {
        const response = await api.delete(`/user/campaigns/${campaignId}`);
        return response.data;
    },

    // Publish campaign (consumes credit)
    publishCampaign: async (campaignId, planId = null) => {
        try {
            const response = await api.post(`/user/campaigns/${campaignId}/publish`, { campaignId, planId });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 403) {
                return {
                    success: false,
                    message: error.response.data.message,
                    needsPayment: true
                };
            }
            throw error;
        }
    },
};
