"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import userAuthStore from "@/store/userAuthStore";
import Link from "next/link";
export default function LoginModal({ isOpen, onClose, onSuccess, shouldRedirect = true }) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, error, clearError } = userAuthStore();
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      clearError();

      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        onSuccess?.();
        onClose();
        // Redirect to user dashboard create page if requested
        if (shouldRedirect) {
          router.push("/user/dashboard/create");
        }
      }
    } catch (err) {
      console.error("Google Sign-In error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In failed");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className=" flex items-center justify-center gap-2 text-center"></DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4 ">
          {/* DropPR Logo */}
          <div className=" flex items-center justify-center mb-6">
            <Image
              src="/logo.png"
              alt="DropPR.ai"
              width={150}
              height={150}
              priority
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg text-gray-900">
              Sign in to continue
            </h3>
            <p className="text-gray-600 text-sm">
              Please sign in with Google to publish and generate your article.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <div className="w-full">
            {isLoading ? (
              <Button disabled variant="primary" size="md" className="w-full">
                Signing in...
              </Button>
            ) : (
              <div className="w-full [&>div]:w-full! [&>div>iframe]:w-full! [&>div]:max-w-none!">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  size="large"
                  theme="outline"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            )}
          </div>

          <p className="text-xs text-center text-gray-500 max-w-sm">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
