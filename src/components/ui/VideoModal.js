"use client";

import { motion, AnimatePresence } from "framer-motion";

const VideoModal = ({ isOpen, onClose, videoUrl }) => {
    if (!isOpen || !videoUrl) return null;

    // Helper to get embed URL based on platform
    const getEmbedUrl = (url) => {
        try {
            if (url.includes("youtube.com/shorts/")) {
                const videoId = url.split("shorts/")[1]?.split("?")[0];
                return `https://www.youtube.com/embed/${videoId}`;
            }
            if (url.includes("instagram.com/")) {
                const cleanUrl = url.split("?")[0];
                return `${cleanUrl}${cleanUrl.endsWith('/') ? '' : '/'}embed`;
            }
            if (url.includes("tiktok.com/")) {
                const videoId = url.match(/\/video\/(\d+)/)?.[1];
                if (videoId) {
                    return `https://www.tiktok.com/embed/v2/${videoId}`;
                }
            }
        } catch (e) {
            console.error("Error parsing video URL for embed:", e);
        }
        return null;
    };

    const isDirectVideo = (url) => {
        return url.match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video\//i);
    };

    const embedUrl = getEmbedUrl(videoUrl);
    const directVideo = isDirectVideo(videoUrl);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-black w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : directVideo ? (
                        <video
                            src={videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                            <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium">Unable to play video directly.</p>
                            <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="px-6 py-2 bg-primary rounded-full font-bold hover:bg-blue-600 transition-all"
                            >
                                Watch on External Site
                            </a>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VideoModal;
