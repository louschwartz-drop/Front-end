"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Facebook, Twitter, Linkedin, Link2, Copy, Check } from "lucide-react";

export default function ShareMenu({ url, title, text, position = "top-right", showText = false, textLabel = "Share" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fullUrl = typeof window !== "undefined" 
        ? (url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`)
        : url;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text || title,
                    url: fullUrl,
                });
                setIsOpen(false);
            } catch (error) {
                console.log("Error sharing", error);
            }
        } else {
            // fallback to copy
            handleCopy();
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
    };

    const openPopup = (url) => {
        window.open(url, 'share-dialog', 'width=600,height=400');
        setIsOpen(false);
    };

    // Determine dropdown positioning
    const positionClasses = {
        "top-right": "bottom-full right-0 mb-2",
        "bottom-right": "top-full right-0 mt-2",
        "bottom-left": "top-full left-0 mt-2",
        "top-left": "bottom-full left-0 mb-2"
    };

    return (
        <div className={`relative inline-block ${isOpen ? "share-menu-open" : ""}`} ref={menuRef}>
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`text-gray-400 hover:text-primary transition-colors hover:bg-gray-100 border border-transparent hover:border-gray-200 bg-white shadow-sm flex items-center justify-center gap-1.5 group ${showText ? "px-3 py-1.5 rounded-xl text-xs font-bold" : "p-1.5 rounded-full"}`}
                aria-label="Share"
            >
                <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {showText && <span className="text-gray-500 group-hover:text-primary transition-colors text-xs font-semibold">{textLabel}</span>}
            </button>

            {isOpen && (
                <div 
                    className={`absolute ${positionClasses[position] || positionClasses["top-right"]} w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className="px-3 pb-2 mb-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Share to</p>
                    </div>
                    
                    <button 
                        onClick={() => openPopup(shareLinks.twitter)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                        <Twitter className="w-4 h-4 text-blue-400" />
                        Twitter / X
                    </button>
                    <button 
                        onClick={() => openPopup(shareLinks.linkedin)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        LinkedIn
                    </button>
                    <button 
                        onClick={() => openPopup(shareLinks.facebook)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        Facebook
                    </button>
                    
                    <div className="h-px bg-gray-100 my-1 mx-2" />
                    
                    {typeof navigator !== "undefined" && navigator.share && (
                        <button 
                            onClick={handleNativeShare}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                            <Share2 className="w-4 h-4 text-gray-500" />
                            More Options...
                        </button>
                    )}
                    
                    <button 
                        onClick={handleCopy}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>
            )}
        </div>
    );
}
