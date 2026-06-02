"use client";

import { useState, useRef } from "react";
import { X, Star, StarHalf, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitFeedback } from "@/lib/api/user/feedback";
import { toast } from "react-toastify";

const FEEDBACK_TYPES = [
  "Give feedback",
  "Report a bug",
  "Suggest an improvement",
  "Other",
];

export default function FeedbackModal({ isOpen, onClose, user }) {
  const [type, setType] = useState(FEEDBACK_TYPES[0]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setRating(isHalf ? index + 0.5 : index + 1);
  };

  const handleStarMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverRating(isHalf ? index + 0.5 : index + 1);
  };

  const handleStarMouseLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (type === "Give feedback" && rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({ 
        type, 
        rating: type === "Give feedback" ? rating : undefined, 
        message,
        userId: user?._id || user?.id
      });
      toast.success("Feedback submitted successfully");
      setType(FEEDBACK_TYPES[0]);
      setRating(0);
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Feedback</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white text-gray-700 text-sm transition-all"
              >
                <span className="truncate">{type}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTypeDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden p-1.5"
                    >
                      {FEEDBACK_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setType(t);
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            type === t
                              ? "bg-brand-light text-brand-dark font-medium"
                              : "text-gray-600 hover:bg-gray-50 hover:text-brand-blue"
                          }`}
                        >
                          {t}
                          {type === t && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {type === "Give feedback" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div
                className="flex items-center space-x-1"
                onMouseLeave={handleStarMouseLeave}
              >
                {[...Array(5)].map((_, i) => {
                  const currentRating = hoverRating || rating;
                  const isFull = currentRating >= i + 1;
                  const isHalf = currentRating >= i + 0.5 && !isFull;

                  return (
                    <div
                      key={i}
                      className="cursor-pointer p-1"
                      onClick={(e) => handleStarClick(e, i)}
                      onMouseMove={(e) => handleStarMouseMove(e, i)}
                    >
                      {isFull ? (
                        <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                      ) : isHalf ? (
                        <div className="relative">
                          <Star className="w-8 h-8 text-gray-300" />
                          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                      ) : (
                        <Star className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                  );
                })}
                <span className="ml-2 text-sm text-gray-500 font-medium">
                  {rating > 0 ? rating : hoverRating > 0 ? hoverRating : ""}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            ></textarea>
            <div className="text-right text-xs text-gray-400 mt-1">
              {message.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
