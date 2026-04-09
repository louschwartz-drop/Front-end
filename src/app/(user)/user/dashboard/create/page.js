"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import userAuthStore from "@/store/userAuthStore";
import { campaignService } from "@/lib/api/user/campaigns";
import useFileStore from "@/store/filesStore";

export default function CreateCampaignPage() {
  const router = useRouter();

  const [uploadMethod, setUploadMethod] = useState("upload");
  const [videoFile, setVideoFile] = useState(null);
  const [videoLink, setVideoLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [durationError, setDurationError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const fileInputRef = useRef(null);

  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingStream, setRecordingStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoPreviewRef = useRef(null);

  const MAX_VIDEO_DURATION_MINUTES = 5;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordingStream]);

  // Recording timer logic
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_VIDEO_DURATION_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Video preview stream assignment
  useEffect(() => {
    if (isRecording && recordingStream && uploadMethod === "record_video" && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = recordingStream;
    }
  }, [isRecording, recordingStream, uploadMethod]);


  const MAX_VIDEO_DURATION_SECONDS = MAX_VIDEO_DURATION_MINUTES * 60;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setDurationError(null);
        setVideoDuration(null);

        const duration = await checkVideoDuration(file);
        if (duration !== null) {
          setVideoDuration(duration);
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            setDurationError(
              `Video duration (${minutes}:${seconds.toString().padStart(2, "0")}) exceeds the maximum limit of ${MAX_VIDEO_DURATION_MINUTES} minutes`,
            );
            setVideoFile(null);
            toast.error(
              `Video must be ${MAX_VIDEO_DURATION_MINUTES} minutes or less`,
            );
            return;
          }
        }

        setVideoFile(file);
        toast.success("Video file selected!");
      } else {
        toast.error("Please upload a video file (MP4, MOV)");
      }
    }
  };

  const checkVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        resolve(duration);
      };

      video.onerror = () => {
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setDurationError(null);
        setVideoDuration(null);

        const duration = await checkVideoDuration(file);
        if (duration !== null) {
          setVideoDuration(duration);
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            setDurationError(
              `Video duration (${minutes}:${seconds.toString().padStart(2, "0")}) exceeds the maximum limit of ${MAX_VIDEO_DURATION_MINUTES} minutes`,
            );
            setVideoFile(null);
            toast.error(
              `Video must be ${MAX_VIDEO_DURATION_MINUTES} minutes or less`,
            );
            return;
          }
        }

        setVideoFile(file);
        toast.success("Video file selected!");
      } else {
        toast.error("Please upload a video file (MP4, MOV)");
      }
    }
  };

  const getPlatformError = (link) => {
    const PATTERNS = {
      youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|live\/|v\/|embed\/)?([a-zA-Z0-9_-]{11})?(\S*)?$/,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(reels?|p|stories)\/[a-zA-Z0-9_-]+\/?(\?.*)?$/,
      tiktok: /^(https?:\/\/)?([\w-]+\.)?tiktok\.com\/[\w\d@_.\/-]+(\?.*)?$/i,
    };

    if (PATTERNS.youtube.test(link)) return null;
    if (PATTERNS.instagram.test(link)) return null;
    if (PATTERNS.tiktok.test(link)) return null;

    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      return "Please enter a valid YouTube video or Shorts link";
    }
    if (link.includes("instagram.com") || link.includes("instagr")) {
      return "Only Instagram Reels or Posts are supported (Format: instagram.com/reel/...)";
    }
    if (link.includes("tiktok.com") || link.includes("tiktok")) {
      return "Please provide a valid TikTok video link (Format: tiktok.com/@user/video/...)";
    }

    return "Please enter a valid YouTube, Instagram, or TikTok link";
  };

  // Recording Logic
  const startRecording = async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === "record_video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setRecordingStream(stream);

      const options = { mimeType: type === "record_video" ? "video/webm;codecs=vp8,opus" : "audio/webm;codecs=opus" };

      // Fallback for Safari/Mobile
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete options.mimeType;
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: type === "record_video" ? "video/webm" : "audio/webm" });
        const fileName = type === "record_video" ? `recorded_video_${Date.now()}.webm` : `recorded_audio_${Date.now()}.webm`;
        const file = new File([blob], fileName, { type: blob.type });

        setVideoFile(file);
        setVideoDuration(recordingSeconds);

        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
        setRecordingStream(null);
        setIsRecording(false);
      };

      setMediaRecorder(recorder);
      setRecordedChunks([]);

      recorder.start(1000); // Collect data every second
      setRecordingSeconds(0);
      setIsRecording(true);


    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Could not access camera/microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const handleUrlChange = (e) => {

    const value = e.target.value.trim();
    setVideoLink(value);
    if (value) {
      const error = getPlatformError(value);
      setUrlError(error);
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadMethod === "upload" && !videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (uploadMethod === "link" && !videoLink) {
      toast.error("Please enter a video link");
      return;
    }

    if (uploadMethod === "link") {
      const error = getPlatformError(videoLink);
      if (error) {
        setUrlError(error);
        toast.error(error);
        return;
      }
    }

    setUploading(true);

    try {
      const user = userAuthStore.getState().user;

      if (!user) {
        toast.error("Please login to continue");
        setUploading(false);
        router.push("/");
        return;
      }

      const userId = user._id || user.id;

      let campaignId;

      if (uploadMethod === "upload" || uploadMethod === "record_audio" || uploadMethod === "record_video") {
        // Step 1: Create campaign record for local upload / recording
        const createResponse = await campaignService.createCampaign(userId, {
          sourceType: uploadMethod
        });


        if (!createResponse.success) {
          throw new Error(createResponse.message || "Failed to create campaign");
        }

        campaignId = createResponse.data._id;

        // Step 2: Store file in global store for processing page
        useFileStore.getState().setPendingUpload({
          campaignId: campaignId,
          file: videoFile,
        });

        toast.success("Campaign initialized!");
      } else {
        // Handle Social Link Flow
        const createResponse = await campaignService.createCampaignFromLink(userId, videoLink);

        if (!createResponse.success) {
          throw new Error(createResponse.message || "Failed to process link");
        }

        campaignId = createResponse.data._id;
        toast.success("Link processing initialized!");
      }

      // Redirect immediately to processing page
      router.push(`/user/processing/${campaignId}`);
    } catch (error) {
      console.error("Campaign creation error:", error);
      toast.error(error.message || "Failed to create campaign");
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Create New Campaign</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Upload a video (max {MAX_VIDEO_DURATION_MINUTES} minutes) or paste a link to get started
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 md:p-6 p-3"
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Choose Upload Method
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <motion.button
              type="button"
              disabled={isRecording}
              onClick={() => {
                setUploadMethod("upload");
                setVideoFile(null);
                setVideoLink("");
                stopRecording();
              }}
              whileHover={!isRecording ? { scale: 1.02 } : {}}
              whileTap={!isRecording ? { scale: 0.98 } : {}}
              className={`p-2.5 sm:p-4 border-2 rounded-lg transition-all ${uploadMethod === "upload"
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Upload</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Video files</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              disabled={isRecording}
              onClick={() => {
                setUploadMethod("link");
                setVideoFile(null);
                setVideoLink("");
                stopRecording();
              }}
              whileHover={!isRecording ? { scale: 1.02 } : {}}
              whileTap={!isRecording ? { scale: 0.98 } : {}}
              className={`p-2.5 sm:p-4 border-2 rounded-lg transition-all ${uploadMethod === "link"
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Link</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Social URLs</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              disabled={isRecording}
              onClick={() => {
                setUploadMethod("record_audio");
                setVideoFile(null);
                setVideoLink("");
                stopRecording();
              }}
              whileHover={!isRecording ? { scale: 1.02 } : {}}
              whileTap={!isRecording ? { scale: 0.98 } : {}}
              className={`p-2.5 sm:p-4 border-2 rounded-lg transition-all ${uploadMethod === "record_audio"
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Audio</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Direct mic</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              disabled={isRecording}
              onClick={() => {
                setUploadMethod("record_video");
                setVideoFile(null);
                setVideoLink("");
                stopRecording();
              }}
              whileHover={!isRecording ? { scale: 1.02 } : {}}
              whileTap={!isRecording ? { scale: 0.98 } : {}}
              className={`p-2.5 sm:p-4 border-2 rounded-lg transition-all ${uploadMethod === "record_video"
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Video</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Direct camera</p>
                </div>
              </div>
            </motion.button>
          </div>

        </motion.div>

        <AnimatePresence mode="wait">
          {uploadMethod === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File <span className="text-red-500">*</span>
              </label>
              <motion.div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                animate={{
                  scale: dragActive ? 1.02 : 1,
                  borderColor: dragActive
                    ? "#0A5CFF"
                    : videoFile
                      ? "#10B981"
                      : "#D1D5DB",
                  backgroundColor: dragActive
                    ? "#EFF6FF"
                    : videoFile
                      ? "#ECFDF5"
                      : "#FFFFFF",
                }}
                transition={{ duration: 0.2 }}
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
              >
                <AnimatePresence mode="wait">
                  {videoFile ? (
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.1,
                        }}
                        className="w-12 h-12 text-green-500 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </motion.svg>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-900 font-medium"
                      >
                        {videoFile.name}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-gray-600 mt-1"
                      >
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </motion.p>
                      <motion.button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.svg
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </motion.svg>
                      <p className="text-gray-600 mb-2">
                        Drag and drop your video here, or
                      </p>
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-[#0A5CFF] hover:text-[#3B82F6] font-medium"
                      >
                        browse files
                      </motion.button>
                      <p className="text-sm text-gray-500 mt-2">
                        MP4, MOV files only
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Maximum duration: {MAX_VIDEO_DURATION_MINUTES} minutes
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {durationError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-sm text-red-600"
                  >
                    {durationError}
                  </motion.p>
                )}
                {videoFile && videoDuration && !durationError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-gray-600"
                  >
                    Duration: {Math.floor(videoDuration / 60)}:
                    {Math.floor(videoDuration % 60)
                      .toString()
                      .padStart(2, "0")}
                  </motion.p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </motion.div>
            </motion.div>
          ) : uploadMethod === "link" ? (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Link <span className="text-red-500">*</span>
              </label>
              <motion.input
                type="url"
                value={videoLink}
                onChange={handleUrlChange}
                placeholder="YouTube, Instagram Reel, or TikTok video link..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${urlError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#0A5CFF]"
                  }`}
                required
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              />
              <AnimatePresence>
                {urlError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      {urlError}
                    </p>
                    <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-xs text-red-700 font-semibold mb-1">Expected Formats:</p>
                      <ul className="text-[10px] text-red-600 list-disc list-inside space-y-0.5">
                        <li>YouTube: youtube.com/watch?v=ID or /shorts/ID</li>
                        <li>Instagram: instagram.com/reel/ID or /p/ID</li>
                        <li>TikTok: tiktok.com/@user/video/ID</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-sm text-gray-500 mt-2">
                Supported: YouTube, Instagram Reels/Posts, TikTok
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum video length: {MAX_VIDEO_DURATION_MINUTES} minutes
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={uploadMethod}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 md:p-8 p-2 text-center">
                {isRecording ? (
                  <div className="space-y-6">
                    {uploadMethod === "record_audio" && (
                      <>
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                          >
                            <div className="w-8 h-8 bg-red-600 rounded-full" />
                          </motion.div>
                          <div className="absolute -top-1 -right-1">
                            <span className="flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </span>
                          </div>
                        </div>

                        <div className="text-3xl font-mono font-bold text-gray-900">
                          {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                        </div>
                        <p className="text-gray-600 font-medium animate-pulse">
                          Recording Audio...
                        </p>
                      </>
                    )}

                    {uploadMethod === "record_video" && (
                      <div className="relative max-w-md mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-lg border-2 border-red-500">
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-white font-mono font-bold text-sm">
                            {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                          <p className="text-white/80 text-xs font-medium bg-black/40 backdrop-blur-sm py-1 rounded-full">
                            Recording Video...
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={stopRecording}
                        className="bg-gray-900 text-white hover:bg-gray-800 px-8"
                      >
                        Stop & Save
                      </Button>
                    </div>
                  </div>
                ) : videoFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg">Recording Saved!</p>
                      <p className="text-gray-600">{(videoFile.size / 1024 / 1024).toFixed(2)} MB • {Math.floor(videoDuration / 60)}:{String(videoDuration % 60).padStart(2, '0')}</p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          startRecording(uploadMethod);
                        }}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        Record Again
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="text-red-500 hover:underline text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                      {uploadMethod === "record_audio" ? (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {uploadMethod === "record_audio" ? "Record Audio Note" : "Record Video Clip"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Capture your thoughts directly from your {uploadMethod === "record_audio" ? "microphone" : "camera"}. Max 5 minutes.
                      </p>
                      <Button
                        type="button"
                        onClick={() => startRecording(uploadMethod)}
                        className="w-full bg-primary hover:bg-brand-blue shadow-lg shadow-primary/20 scale-105"
                      >
                        Start Recording
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      You'll need to grant {uploadMethod === "record_audio" ? "microphone" : "camera & microphone"} access
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="flex justify-start pt-4 border-t border-gray-200">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={uploading}
              className="px-6 py-3 sm:px-10 sm:py-4 bg-[#0A5CFF] text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base whitespace-nowrap"
            >
              {uploading ? "Creating Campaign..." : "Create Campaign"}
            </Button>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
}
