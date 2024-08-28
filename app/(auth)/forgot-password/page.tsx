"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { AuthCard } from "@/components/AuthCard";
import { InputField } from "@/components/InputField";
import ChatIllustration from "@/components/common/ChatIllustration";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Check your inbox.");
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthCard className="w-[70%]">
        <div className="w-full md:w-1/2 p-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-base-content">
            Reset Your Password
          </h1>
          <p className="text-sm md:text-base text-base-content/70 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              error={error}
            />

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full text-sm md:text-base"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <p className="text-sm md:text-base text-base-content/70 mt-4 text-center">
            Remember your password?{" "}
            <Link href="/signin" className="text-primary underline">
              Sign In
            </Link>
          </p>
        </div>

        <div className="w-full md:w-1/2 hidden md:flex flex-col items-center justify-center">
          <ChatIllustration />
        </div>
      </AuthCard>
    </div>
  );
}