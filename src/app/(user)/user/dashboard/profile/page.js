"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";
import { toast } from "react-toastify";
import api from "@/lib/api/axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { uploadFileToS3 } from "@/utils/awsService";
import ImageCropper from "@/components/ui/ImageCropper";
import { CreditCard, Trash2, ShieldCheck } from "lucide-react";

import { paymentService } from "@/lib/api/user/payments";

function CardManagement() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = userAuthStore();
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId) {
      loadCards();
    }
  }, [userId]);

  const loadCards = async () => {
    try {
      const res = await paymentService.getCards(userId);
      if (res.success) setCards(res.data);
    } catch (error) {
      console.error("Failed to load cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId) => {
    if (!confirm("Are you sure you want to remove this card?")) return;
    try {
      const res = await paymentService.deleteCard(cardId);
      if (res.success) {
        toast.success("Card removed");
        setCards(cards.filter(c => c.id !== cardId));
      }
    } catch (error) {
      toast.error("Failed to remove card");
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 h-12 bg-gray-100 rounded"></div></div>;

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
          No saved payment methods found. They will appear here once you complete a purchase.
        </div>
      ) : (
        cards.map(card => (
          <div key={card.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">
                  {card.card.brand} •••• {card.card.last4}
                </p>
                <p className="text-xs text-gray-500">
                  Expires {card.card.exp_month}/{card.card.exp_year}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(card.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))
      )}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4" />
        Securely powered by Stripe
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    updateUser,
  } = userAuthStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);

  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !profileLoaded) {
      fetchProfile();
      setProfileLoaded(true);
    }
  }, [isAuthenticated, user, profileLoaded]);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImage(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    setAvatarFile(croppedBlob);
    setPreviewUrl(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
    setTempImage(null);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  const fetchProfile = async () => {
    try {
      const userId = user._id || user.id;
      const { profileService } = await import("@/lib/api/user/profile");
      const response = await profileService.getProfile(userId);
      if (response.success) {
        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
        });
        // Optionally update store if server has newer data
        updateUser(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Phone validation using standard libphonenumber-js
    if (formData.phone && !isValidPhoneNumber("+" + formData.phone.replace(/\D/g, ""))) {
      toast.error("Please Enter a Valid Number");
      return;
    }

    setSaving(true);

    try {
      const userId = user._id || user.id;
      let avatarUrl = user.avatar;

      // If there's a new avatar file selected (cropped blob), upload it to AWS
      if (avatarFile) {
        const { uploadFileToS3 } = await import("@/utils/awsService");
        avatarUrl = await uploadFileToS3(avatarFile);
      }

      // Save to Backend Database
      const { profileService } = await import("@/lib/api/user/profile");
      const response = await profileService.updateProfile(userId, {
        name: formData.name,
        phone: formData.phone,
        avatar: avatarUrl,
      });

      if (response.success) {
        // Update local store
        updateUser(response.data);
        setAvatarFile(null); // Clear pending file
        toast.success("Profile updated successfully!");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className=" mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="relative inline-block">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-gray-100">
                    <span className="text-3xl font-bold text-white">
                      {getInitials(user?.name)}
                    </span>
                  </div>
                )}
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    document.getElementById("avatar-upload-input").click()
                  }
                  disabled={uploading}
                  type="button"
                >
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploading ? (
                    <svg
                      className="animate-spin h-4 w-4 text-gray-600"
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
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{user?.email || ""}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center text-sm">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-gray-600">
                  Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2025'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
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
                <span className="text-gray-600">Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Personal Information
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Your email address cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  country={"us"}
                  value={formData.phone}
                  onChange={(phone) => {
                    setFormData({ ...formData, phone: phone });
                  }}
                  inputClass="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  buttonClass="border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100"
                  dropdownClass="border border-gray-300 rounded-lg bg-white shadow-lg"
                  containerClass="w-full"
                  inputProps={{
                    name: "phone",
                    required: true,
                  }}
                  placeholder="Enter phone number"
                  inputStyle={{
                    width: "100%",
                    height: "42px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    paddingLeft: "48px",
                  }}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Payment Methods Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Payment Methods
            </h3>

            <CardManagement />
          </div>

          {/* Security Section */}
        </div>
      </div>
      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
