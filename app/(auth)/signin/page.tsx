"use client"
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { AuthCard } from "@/components/AuthCard";
import { InputField } from "@/components/InputField";
import { PasswordField } from "@/components/PasswordField";
import ChatIllustration from "@/components/common/ChatIllustration";
import { BlurredLoadingSpinner } from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function SignIn() {
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsFormValid(
      form.emailOrUsername.trim() !== "" && form.password.trim() !== ""
    );
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        emailOrUsername: form.emailOrUsername,
        password: form.password,
      });
      if (result?.error) {
        console.log("Sign in error:", result);
        toast.error("An unexpected error occurred. Please try again.");
        setError(result.error);
      } else {
        setIsRedirecting(true);
        const callbackUrl = searchParams.get("callbackUrl") as
          | string
          | undefined;
        if (callbackUrl) {
          const decodedUrl = decodeURIComponent(callbackUrl);
          const urlParams = new URLSearchParams(decodedUrl.split("?")[1]);
          const token = urlParams.get("token");

          if (decodedUrl.startsWith("/invite") && token) {
            router.push(`/accept-invite?token=${token}`);
          } else {
            router.push(callbackUrl);
          }
        } else {
          toast.success("Signed in successfully!");
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <h2 className="bg-black py-2 font-semibold mb-2 text-center text-base-content">
          Powered with our very own translation model for local African languages.
    </h2>
    <div className="min-h-screen flex items-center justify-center p-4">
      {isRedirecting && <BlurredLoadingSpinner />}
      <AuthCard className="w-full sm:w-[90%] md:w-[70%] max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-1/2 p-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-base-content">
            Hi, Welcome back!
          </h1>
          <p className="text-sm md:text-base text-base-content/70 mb-6 text-center">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email or Username"
              name="emailOrUsername"
              type="text"
              value={form.emailOrUsername}
              onChange={handleChange}
              placeholder="example@mail.com or username"
              error={error || undefined}
            />
            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={error || undefined}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mr-2"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span className="label-text text-sm md:text-base text-base-content/80">
                  Remember information
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-primary text-sm md:text-base"
              >
                Forgot Password?
              </Link>
            </div>
            {error && (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error === "CredentialsSignin" && "Invalid Credentials: Please Check Email/Username or Password"}</span>
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full text-sm md:text-base"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-sm md:text-base text-base-content/70 mt-4 text-center">
            Don't have an account?{" "}  <br/>
            <Link href="/signup" className="text-primary underline">
              Create an account
            </Link>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-1/2 p-0 hidden md:flex flex-col items-center justify-center"
        >
          <ChatIllustration />
        </motion.div>
      </AuthCard>
    </div>
    </>
  );
}