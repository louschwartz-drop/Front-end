"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { supportService } from "@/lib/api/user/support";
import userAuthStore from "@/store/userAuthStore";

export default function ContactPage() {
  const router = useRouter();
  const { user } = userAuthStore();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    company: "",
    jobTitle: "",
    howFound: "",
    salesperson: "",
    pressReleaseVolume: "below 5",
    pressPer: "per month",
    lookingFor: "",
    measureSuccess: "",
    otherComments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSalesperson, setShowSalesperson] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.company.trim()) newErrors.company = "Company name is required";
    if (!formData.howFound) newErrors.howFound = "Please tell us how you found us";
    if (formData.howFound === "Salesperson" && !formData.salesperson.trim()) {
      newErrors.salesperson = "Please specify the salesperson's name";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warn("Please fix the validation errors before submitting.", {
        position: "top-right",
      });
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        userId: user?._id || user?.id || null,
      };

      const response = await supportService.addSupportTicket(payload);

      if (response.success) {
        toast.success(
          "Thank you for your enquiry! Our sales team will contact you within 24 hours.",
          {
            position: "top-right",
            autoClose: 4000,
          },
        );

        // Reset form
        setFormData({
          firstName: "",
          email: "",
          company: "",
          jobTitle: "",
          howFound: "",
          salesperson: "",
          pressReleaseVolume: "below 5",
          pressPer: "per month",
          lookingFor: "",
          measureSuccess: "",
          otherComments: "",
        });
        setShowSalesperson(false);
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to send message. Please try again.",
        {
          position: "top-right",
          autoClose: 3000,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-gray-50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 xl:gap-12">
            {/* Left Section - Information */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Sales Enquiry
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Interested in our services? Chat with one of our sales
                  representatives to explore how DropPR.ai can work for you.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-4 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-brand-blue"
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
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Chat with our sales representatives to see how DropPR.ai
                      can enhance your brand and make sure you're getting the
                      most value
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-brand-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Tailor your pricing plans with customized solutions to
                      ensure maximum value for your business
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-brand-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Build credibility for your brand with trusted solutions
                      and expert support
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Section - Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                  Contact Sales
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-brand-blue">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({ ...formData, firstName: e.target.value });
                          if (errors.firstName) setErrors(prev => ({ ...prev, firstName: "" }));
                        }}
                        placeholder="Your Name"
                        maxLength={50}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-brand-blue">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                        }}
                        placeholder="Your Email"
                        maxLength={100}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Company & Job Title Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company name <span className="text-brand-blue">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => {
                          setFormData({ ...formData, company: e.target.value });
                          if (errors.company) setErrors(prev => ({ ...prev, company: "" }));
                        }}
                        placeholder="Your Company"
                        maxLength={100}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${errors.company ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job title
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, jobTitle: e.target.value })
                        }
                        placeholder="Your position/job title"
                        maxLength={100}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* How Found Us */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How did you find us?{" "}
                      <span className="text-brand-blue">*</span>
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <select
                          required
                          value={formData.howFound}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              howFound: e.target.value,
                            });
                            setShowSalesperson(
                              e.target.value === "Salesperson",
                            );
                            if (errors.howFound) setErrors(prev => ({ ...prev, howFound: "" }));
                          }}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none bg-white cursor-pointer ${errors.howFound ? 'border-red-500' : 'border-gray-300'}`}
                          style={{
                            color: formData.howFound
                              ? "#000"
                              : "rgba(0, 0, 0, 0.38)",
                          }}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          <option value="Organic Search">Organic Search</option>
                          <option value="Ads">Ads</option>
                          <option value="Word-of-mouth">Word-of-mouth</option>
                          <option value="Other Websites">Other Websites</option>
                          <option value="Email">Email</option>
                          <option value="Salesperson">Salesperson</option>
                          <option value="Others">Others</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      {showSalesperson && (
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.salesperson}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                salesperson: e.target.value,
                              });
                              if (errors.salesperson) setErrors(prev => ({ ...prev, salesperson: "" }));
                            }}
                            placeholder="Name of salesperson"
                            maxLength={100}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all ${errors.salesperson ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.salesperson && <p className="text-red-500 text-xs mt-1">{errors.salesperson}</p>}
                        </div>
                      )}
                    </div>
                    {errors.howFound && <p className="text-red-500 text-xs mt-1">{errors.howFound}</p>}
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200 my-8" />

                  {/* Volume Needs */}
                  <div>
                    <label className="block text-sm font-medium text-brand-blue mb-3">
                      What's your expected volume?
                    </label>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        <span className="text-gray-700 text-sm">
                          On average, I need:
                        </span>
                        <div className="relative w-full">
                          <select
                            value={formData.pressReleaseVolume}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pressReleaseVolume: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none bg-white cursor-pointer"
                          >
                            <option value="below 5">below 5</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="300">300</option>
                            <option value="1500+">1500+</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <span className="text-gray-700 text-sm">per period:</span>
                        <div className="relative w-full">
                          <select
                            value={formData.pressPer}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pressPer: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all appearance-none bg-white cursor-pointer"
                          >
                            <option value="per month">per month</option>
                            <option value="per year">per year</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Looking For */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-medium text-brand-blue">
                        What are you looking for?
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {formData.lookingFor.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={formData.lookingFor}
                      onChange={(e) =>
                        setFormData({ ...formData, lookingFor: e.target.value })
                      }
                      rows="3"
                      placeholder="I'm looking for..."
                      maxLength={1000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Measure Success */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-brand-blue">
                        How do you measure success?
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {formData.measureSuccess.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={formData.measureSuccess}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          measureSuccess: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="Tell us more..."
                      maxLength={1000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Other Comments */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-brand-blue">
                        Other comments to us{" "}
                        <span className="text-gray-500 font-normal">
                          (Keep it short & simple)
                        </span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {formData.otherComments.length}/500
                      </span>
                    </div>
                    <textarea
                      value={formData.otherComments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otherComments: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="Tell us more..."
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-blue text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
