"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import {
    Upload,
    ZoomIn,
    ZoomOut,
    Loader2,
    Check,
    Move,
    RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminBlogService } from "@/lib/api/admin/blogs";

export default function ImageUploadModal({
    isOpen,
    onClose,
    onUploadSuccess,
    title = "Adjust Image",
    aspectRatio = 1,
    disableCrop = false,
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const [imageFile, setImageFile] = useState(null);

    // Transformation State
    const [zoom, setZoom] = useState(1);
    const [baseScale, setBaseScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropMode, setCropMode] = useState("crop"); // 'crop', 'fit', 'stretch'

    const imgRef = useRef(null);
    const containerRef = useRef(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setImagePreview("");
            setImageFile(null);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setCropMode("crop");
        }
    }, [isOpen]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const minWidth = aspectRatio === 1 ? 200 : 600;
            const minHeight = aspectRatio === 1 ? 200 : 300;
            
            if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
                toast.error(`Image resolution too low (${img.naturalWidth}x${img.naturalHeight}). Please upload an image with at least ${minWidth}x${minHeight} resolution.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                if (readerEvent.target?.result) {
                    setImagePreview(readerEvent.target.result);
                    setImageFile(file);
                }
            };
            reader.readAsDataURL(file);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            toast.error("Invalid image file");
        };
        img.src = objectUrl;
    };

    const onImageLoad = () => {
        if (!imgRef.current || !containerRef.current) return;
        const img = imgRef.current;
        const container = containerRef.current;

        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        const fitScale = Math.min(cw / naturalWidth, ch / naturalHeight);
        setBaseScale(fitScale);
        setZoom(fitScale);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (!imagePreview) return;
        setIsDragging(true);
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDragging) return;
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
            setPosition({
                x: clientX - dragStart.x,
                y: clientY - dragStart.y,
            });
        },
        [isDragging, dragStart]
    );

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleMouseMove);
            window.addEventListener("touchend", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    const handleUpload = async () => {
        if (!imageFile || !imgRef.current || !containerRef.current) {
            toast.error("Please select an image first");
            return;
        }

        try {
            setIsUploading(true);

            const img = imgRef.current;
            const container = containerRef.current;

            const cw = container.clientWidth;
            const ch = container.clientHeight;

            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;

            // Crop dimensions mapping original image pixels
            const w_orig = cw / zoom;
            const h_orig = ch / zoom;

            // Bounding box offsets relative to center
            const x_orig = (naturalWidth - w_orig) / 2 - (position.x / zoom);
            const y_orig = (naturalHeight - h_orig) / 2 - (position.y / zoom);

            // Output resolution scales dynamically to preserve original pixels, capped at 2048px
            let targetWidth = Math.round(w_orig);
            if (targetWidth > 2048) {
                targetWidth = 2048;
            }
            const targetHeight = Math.round(targetWidth / aspectRatio);

            let blob;
            if (disableCrop) {
                // If disableCrop is true, just use the original file
                blob = imageFile;
            } else {
                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas context not available");

                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                if (cropMode === "crop") {
                    ctx.drawImage(
                        img, 
                        x_orig, 
                        y_orig, 
                        w_orig, 
                        h_orig, 
                        0, 
                        0, 
                        canvas.width, 
                        canvas.height
                    );
                } else if (cropMode === "fit") {
                    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
                    const w = img.naturalWidth * scale;
                    const h = img.naturalHeight * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;
                    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
                } else if (cropMode === "stretch") {
                    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
                }

                blob = await new Promise((resolve) =>
                    canvas.toBlob(resolve, "image/jpeg", 0.95)
                );
            }
            if (!blob) throw new Error("Failed to create image blob");

            const formData = new FormData();
            formData.append("image", blob, "blog-image.jpg");

            const data = await adminBlogService.uploadImage(formData);

            if (data.success) {
                onUploadSuccess(data.url);
                toast.success("Image uploaded successfully!");
                onClose();
            } else {
                throw new Error(data.message || "Upload failed");
            }
        } catch (error) {
            toast.error(error.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => onImageLoad();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 ">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight flex items-center pb-2 gap-3">
                            <Move className="text-primary" size={24} />
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    {!imagePreview ? (
                        <div className="space-y-4 mb-6">
                            <label className="border-4 border-dashed border-gray-100 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all group relative overflow-hidden">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                />
                                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                    <Upload
                                        className="text-gray-400 group-hover:text-primary"
                                        size={36}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                                        Choose an Image
                                    </p>
                                    <p className="text-sm text-gray-400 mt-2 font-medium">
                                        Drag and drop or click to browse
                                    </p>
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-6">
                            <div
                                ref={containerRef}
                                className="relative w-full bg-[#f8fafc] rounded-2xl overflow-hidden border-4 border-gray-50 shadow-inner group touch-none mx-auto"
                                style={{ aspectRatio: aspectRatio }}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleMouseDown}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform: (disableCrop || cropMode !== "crop") ? "translate(-50%, -50%)" : `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        cursor: (disableCrop || cropMode !== "crop") ? "default" : (isDragging ? "grabbing" : "grab"),
                                        transition: isDragging
                                            ? "none"
                                            : "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: (disableCrop || cropMode !== "crop") ? "100%" : "auto",
                                        height: (disableCrop || cropMode !== "crop") ? "100%" : "auto",
                                    }}
                                >
                                    <img
                                        ref={imgRef}
                                        src={imagePreview}
                                        alt="Preview"
                                        onLoad={onImageLoad}
                                        className="max-w-none pointer-events-none select-none"
                                        style={{
                                            width: (disableCrop || cropMode !== "crop") ? "100%" : "auto",
                                            height: (disableCrop || cropMode !== "crop") ? "100%" : "auto",
                                            objectFit: disableCrop ? "contain" : (cropMode === "fit" ? "contain" : (cropMode === "stretch" ? "fill" : "initial")),
                                        }}
                                    />
                                </div>

                            {!disableCrop && cropMode === "crop" && (
                                <>
                                    <div className="absolute inset-0 pointer-events-none bg-black/5">
                                        <div className="absolute inset-[10px] border-2 border-white/80 border-dashed rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] backdrop-blur-[0.5px]" />
                                    </div>

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-[11px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        <Move size={12} /> Drag to position image
                                    </div>
                                </>
                            )}
                            </div>

                            <div className="flex flex-col gap-4">
                                {!disableCrop && (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={cropMode === "crop" ? "default" : "outline"}
                                            onClick={() => setCropMode("crop")}
                                            className={`flex-1 h-9 text-xs font-bold rounded-lg border border-gray-200 transition-all ${cropMode === "crop" ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary/90' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Crop / Zoom
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={cropMode === "fit" ? "default" : "outline"}
                                            onClick={() => setCropMode("fit")}
                                            className={`flex-1 h-9 text-xs font-bold rounded-lg border border-gray-200 transition-all ${cropMode === "fit" ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary/90' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Fit to Box
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={cropMode === "stretch" ? "default" : "outline"}
                                            onClick={() => setCropMode("stretch")}
                                            className={`flex-1 h-9 text-xs font-bold rounded-lg border border-gray-200 transition-all ${cropMode === "stretch" ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary/90' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Stretch
                                        </Button>
                                    </div>
                                )}

                                {!disableCrop && cropMode === "crop" && (
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-6 px-3 sm:px-4 py-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="rounded-full w-10 h-10 p-0 hover:bg-white hover:shadow-sm"
                                            onClick={() => setZoom(z => Math.max(z / 1.1, baseScale * 0.2))}
                                        >
                                            <ZoomOut size={18} className="text-gray-500" />
                                        </Button>

                                        <input 
                                            type="range"
                                            className="flex-1 accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            min={baseScale * 0.2}
                                            max={baseScale * 5}
                                            step={baseScale * 0.01}
                                            value={zoom}
                                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="rounded-full w-10 h-10 p-0 hover:bg-white hover:shadow-sm"
                                            onClick={() => setZoom(z => Math.min(z * 1.1, baseScale * 5))}
                                        >
                                            <ZoomIn size={18} className="text-gray-500" />
                                        </Button>

                                        <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="rounded-full w-10 h-10 p-0 hover:bg-white hover:shadow-sm"
                                                onClick={handleReset}
                                                title="Reset"
                                            >
                                                <RotateCcw size={16} className="text-gray-500" />
                                            </Button>
                                            <span className="text-gray-900 font-bold text-xs min-w-[35px]">
                                                {Math.round((zoom / baseScale) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-gray-400 text-xs font-bold hover:text-primary transition-colors hover:bg-transparent"
                                        onClick={() => setImagePreview("")}
                                    >
                                        Change selected image
                                    </Button>
                                    {!disableCrop && (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {aspectRatio === 1 ? "Square Ratio" : "Landscape Ratio"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-6 flex gap-3 sm:gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!imagePreview || isUploading}
                        onClick={handleUpload}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl"
                    >
                        {isUploading ? (
                            <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Check size={20} /> Save Image
                            </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
