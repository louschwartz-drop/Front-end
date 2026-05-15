"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import adminAuthStore from "@/store/adminAuthStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function LoginForm({ redirectPath }) {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = adminAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      // Check if it's a verification error
      if (error.message.includes("verify your email") || error.message.includes("403")) {
        setShowOTP(true);
        setSubmitError("Verification required. Please enter the OTP sent to your email.");
      } else {
        setSubmitError(error.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setSubmitError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      // We need a verifyOTP method in the store or service
      const { adminAuthService } = await import("@/lib/api/admin/auth");
      await adminAuthService.verifyOTP({ otp });
      
      // Update local state to verified
      const { admin, updateAdmin } = adminAuthStore.getState();
      updateAdmin({ isEmailVerified: true });
      
      router.push("/admin/dashboard");
    } catch (error) {
      setSubmitError(error.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-blue/5 via-white to-brand-blue/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1 group w-fit"
            >
              <Image
                src="/drop-logo.png"
                alt="Drop PR"
                width={50}
                height={50}
                className=""
              />

              <div>
                <h1 className="text-3xl font-bold text-gray-900">Drop PR</h1>
                <p className="text-sm text-gray-600">Admin Portal</p>
              </div>
            </Link>

            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Manage Your
                <br />
                <span className="text-brand-blue">Campaigns</span> with Ease
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Access powerful tools to monitor campaigns, manage users, and
                track performance metrics all in one place.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-brand-blue"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Real-time Analytics
                  </h3>
                  <p className="text-sm text-gray-600">
                    Track campaign performance with live data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-brand-blue"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Control access and monitor activity logs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-brand-blue"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Access</h3>
                  <p className="text-sm text-gray-600">
                    Enterprise-grade security protocols
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full flex flex-col items-center justify-center">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <Image
                  src="/drop-logo.png"
                  alt="Drop PR"
                  width={36}
                  height={36}
                  className=""
                />
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Drop PR
                  </h1>
                  <p className="text-xs text-gray-600">Admin Portal</p>
                </div>
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 w-full max-w-[400px] lg:max-w-none">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={showOTP ? handleOTPVerify : handleSubmit} className="space-y-6">
                {!showOTP ? (
                  <>
                    <Input
                      type="email"
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@droppr.ai"
                      required
                      error={errors.email}
                    />

                    <Input
                      type="password"
                      label="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      error={errors.password}
                      showPasswordToggle={true}
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="6-Digit Verification Code"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-[1em] font-bold"
                    />
                    <p className="text-sm text-gray-500 text-center">
                      We've sent a code to <span className="font-semibold">{formData.email}</span>
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className={`px-4 py-3 rounded-xl text-sm flex items-start gap-3 ${showOTP && !submitError.includes("failed") ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  className="mt-8 h-12 text-base font-semibold"
                >
                  {showOTP ? "Verify & Continue" : "Sign In to Dashboard"}
                </Button>
                
                {showOTP && (
                   <button 
                    type="button"
                    onClick={() => setShowOTP(false)}
                    className="w-full text-center text-sm text-gray-500 hover:text-brand-blue transition-colors mt-2"
                   >
                     Back to Login
                   </button>
                )}
              </form>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPageWrapper() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  return <LoginForm redirectPath={redirectPath} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-brand-blue/5 via-white to-brand-blue/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent"></div>
        </div>
      }
    >
      <LoginPageWrapper />
    </Suspense>
  );
}
