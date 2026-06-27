"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import userAuthStore from "@/store/userAuthStore";
import Link from "next/link";
import {
  Github,
  Mail,
  Loader2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

function UserAuthContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login", "signup", or "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpToken, setOtpToken] = useState(null); // temp JWT from register response
  const [resendCooldown, setResendCooldown] = useState(0);

  const { error: storeError, clearError } = userAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/user/dashboard/create";

  useEffect(() => {
    if (localError || storeError) {
      const timer = setTimeout(() => {
        setLocalError(null);
        if (storeError) clearError();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [localError, storeError, clearError]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      clearError();
      setLocalError(null);

      // trigger next-auth signin and redirect to the correct page
      await signIn(provider, { callbackUrl: returnTo });
    } catch (err) {
      console.error(`${provider} Sign-In error:`, err);
      setLocalError(`Failed to connect with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      clearError();
      setLocalError(null);

      if (authMode === "signup") {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!strongPasswordRegex.test(password)) {
          setLocalError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setLocalError("Passwords do not match.");
          setIsLoading(false);
          return;
        }
      }

      if (authMode === "login") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result.error) {
          setLocalError(result.error);
        } else {
          // Hard redirect to sync auth state immediately
          window.location.href = returnTo;
        }
      } else {
        // Handle Signup via our backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.data?.isEmailVerified) {
            // Already verified (e.g. social merge), just sign in via NextAuth
            const result = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (result?.error) {
              setLocalError(result.error);
            } else {
              window.location.href = returnTo;
            }
          } else {
            // Store the temp token and move to OTP step
            setOtpToken(data.token);
            setOtpValue("");
            setAuthMode("otp");
            setResendCooldown(60);
          }
        } else {
          if (data.message?.toLowerCase().includes("exists") || data.message?.toLowerCase().includes("in use")) {
            setLocalError("Your account is already connected with Google. Please log in with Google.");
          } else {
            setLocalError(data.message);
          }
        }
      }
    } catch (err) {
      setLocalError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setLocalError("Please enter the 6-digit code sent to your email.");
      return;
    }
    try {
      setIsLoading(true);
      clearError();
      setLocalError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otpToken}`,
        },
        body: JSON.stringify({ otp: otpValue }),
      });
      const data = await res.json();
      if (data.success) {
        // OTP verified — sign in via NextAuth so session is established
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          setLocalError(result.error);
        } else {
          window.location.href = returnTo;
        }
      } else {
        setLocalError(data.message || "Invalid or expired OTP.");
      }
    } catch {
      setLocalError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !otpToken) return;
    try {
      setIsLoading(true);
      setLocalError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otpToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
        setOtpValue("");
      } else {
        setLocalError(data.message || "Failed to resend OTP.");
      }
    } catch {
      setLocalError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Column: Branding & Features */}
        <div className="hidden md:flex md:w-[40%] bg-slate-900 p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-8">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="DropPR"
                  width={140}
                  height={40}
                  className="brightness-0 invert opacity-90 cursor-pointer"
                />
              </Link>
            </div>

            <h2 className="text-3xl font-extrabold mb-4 tracking-tight leading-tight">
              Empowering your Press Release journey.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Join thousands of creators using DropPR.ai to generate and publish professional articles in seconds.
            </p>

            <ul className="space-y-4">
              {[
                "AI Article Generation",
                "Global Distribution",
                "Real-time Analytics"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 mt-auto pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Trusted by 500+ global marketing agencies.
            </p>
          </div>
        </div>

        {/* Right Column: Auth Forms */}
        <div className="w-full md:w-[60%] p-6 sm:p-10 md:p-12 flex flex-col bg-white justify-center">

          {/* OTP Verification Flow */}
          {authMode === "otp" ? (
            <div className="w-full max-w-[400px] mx-auto">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Check your email</h3>
                <p className="text-slate-500 text-sm">
                  We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                </p>
              </div>

              {(localError || storeError) && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
                  {localError || storeError}
                </div>
              )}

              <form onSubmit={handleOTPVerify} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full text-center text-3xl tracking-[0.6em] font-bold py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  disabled={isLoading || otpValue.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Verify &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-all block mx-auto"
                >
                  ← Back to signup
                </button>
              </div>
            </div>
          ) : (
            /* Login & Signup Forms */
            <div className="w-full max-w-[420px] mx-auto space-y-6">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
                  {authMode === "login" ? "Welcome Back" : "Create Account"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {authMode === "login"
                    ? "Select a provider or use your email address."
                    : "Start your professional journey with us today."}
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <SocialButton
                  icon={
                    <svg width="20" height="20" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  }
                  label="Google"
                  onClick={() => handleSocialLogin("google")}
                  isLoading={isLoading}
                />
                <SocialButton
                  icon={<Github className="w-5 h-5 text-slate-900" />}
                  label="GitHub"
                  onClick={() => handleSocialLogin("github")}
                  isLoading={isLoading}
                />
              </div>

              {(localError || storeError) && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
                  {localError || storeError}
                </div>
              )}

              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <span className="relative px-4 text-xs uppercase tracking-widest text-slate-400 bg-white">
                  or use email
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <ArrowRight className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {authMode === "signup" && (
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4.5 h-4.5 shrink-0 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                      required
                    />
                    <label htmlFor="terms" className="text-[10px] text-slate-500 leading-snug">
                      By checking this, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  disabled={isLoading || (authMode === "signup" && !agreeTerms)}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === "login" ? "Sign In" : "Create My Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                    className="font-bold text-primary hover:underline transition-all"
                  >
                    {authMode === "login" ? "Create one" : "Sign in here"}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialButton({ icon, label, onClick, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all group disabled:opacity-50 cursor-pointer"
    >
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-xs font-bold text-slate-700">{label}</span>
    </button>
  );
}

export default function UserAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <UserAuthContent />
    </Suspense>
  );
}
