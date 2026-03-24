"use client";

import { useState, useRef } from "react";
import { X, Star, StarHalf } from "lucide-react";
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
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            ></textarea>
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
