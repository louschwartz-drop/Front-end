"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import adminAuthStore from "@/store/adminAuthStore";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { uploadFileToS3 } from "@/utils/awsService";
import ImageCropper from "@/components/ui/ImageCropper";
import { adminProfileService } from "@/lib/api/admin/profile";

function AdminProfilePageContent() {
  const router = useRouter();
  const { admin: user, updateAdmin } = adminAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user._id) {
        try {
          const profileData = await adminProfileService.getProfile(user._id);
          if (profileData && profileData.data) {
            setFormData({
              name: profileData.data.name || "",
              email: profileData.data.email || "",
              phone: profileData.data.phone || "",
            });
            // Also update store to keep it in sync
            updateAdmin(profileData.data);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
    };

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      fetchProfile();
    }
  }, [user?._id]);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getInitials = (name) => {
    if (!name) return "A";
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      let avatarUrl = user.avatar;

      // If there's a new avatar file selected (cropped blob), upload it to AWS
      if (avatarFile) {
        console.log("Starting upload to AWS...", avatarFile);
        // Upload to AWS S3
        avatarUrl = await uploadFileToS3(avatarFile);
        console.log("AWS Upload Success! Returned URL:", avatarUrl);
      }

      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone?.trim() || null,
        avatar: avatarUrl,
      };

      console.log("Saving admin data to backend:", updateData);

      // Call API to update profile
      const response = await adminProfileService.updateProfile(user._id, updateData);

      if (response && response.success) {
        // Update admin store with the returned updated admin data
        updateAdmin(response.data);

        setAvatarFile(null); // Clear pending file

        toast.success("Profile updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error(response?.message || "Failed to update profile");
      }

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
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
                    alt={user.name || "Admin"}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-blue-600 flex items-center justify-center border-4 border-gray-100">
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
                {user?.name || "Admin"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{user?.email || ""}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Administrator
              </span>
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
                  Admin since {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="text-gray-600">Full Access</span>
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
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${errors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#0A5CFF] focus:border-transparent"
                    }`}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                )}
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
                    required: false,
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
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
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

export default function AdminProfilePage() {
  return <AdminProfilePageContent />;
}
