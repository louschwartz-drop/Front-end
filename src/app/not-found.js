"use client";
import React from "react";
import { Home, Search, ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full text-center">
        {/* Animated 404 Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-indigo-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="relative flex items-center justify-center">
            <FileQuestion
              className="w-32 h-32 text-indigo-600 animate-bounce"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl font-bold text-indigo-600 mb-4 tracking-tight">
          404
        </h1>

        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have wandered off. Don't
          worry, even the best explorers get lost sometimes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>

          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}

        {/* Footer Text */}
        <p className="text-sm text-gray-500 mt-8">
          Error Code: 404 | Page Not Found
        </p>
      </div>
    </div>
  );
}
