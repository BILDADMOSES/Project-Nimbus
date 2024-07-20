"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import gIcon from "@/app/assets/img/g-icon.png";
import { useSignUp } from "@/hooks/useSignUp";
import { useState, useEffect } from "react";
import ChatIllustration from "@/components/common/ChatIllustration";
import Link from "next/link";

const SignUp = () => {
  const { form, handleChange, handleSubmit, errors, isLoading } = useSignUp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setPasswordsMatch(form.password === form.confirmPassword);
  }, [form.password, form.confirmPassword]);

  const isFormValid = () => {
    return (
      form.email &&
      form.firstName &&
      form.lastName &&
      form.password &&
      form.confirmPassword &&
      passwordsMatch &&
      termsAccepted
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Column - Sign Up Form */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center"
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Create an Account
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
            Join us to start chatting across languages.
          </p>

          <button className="card bg-base-100 shadow-sm mb-6 w-full cursor-pointer hover:bg-gray-100 transition-colors flex-row justify-center">
            <div className="card-body p-3 md:p-4 flex-row items-center justify-center text-center">
              <Image
                src={gIcon}
                width={16}
                height={16}
                alt="Google"
                className="mr-2 text-center"
              />
              <span className="text-sm md:text-base text-center">
                Sign up with Google
              </span>
            </div>
          </button>

          <p className="text-center text-gray-400 text-sm md:text-base mb-6">
            or
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Email address
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@mail.com"
                className={`input input-bordered w-full bg-white text-sm md:text-base ${
                  errors.email ? "input-error" : ""
                }`}
              />
              {errors.email && (
                <p className="text-error text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="label pl-0">
                  <span className="label-text text-sm md:text-base text-gray-600">
                    First Name
                  </span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`input input-bordered w-full bg-white text-sm md:text-base ${
                    errors.firstName ? "input-error" : ""
                  }`}
                />
                {errors.firstName && (
                  <p className="text-error text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="label pl-0">
                  <span className="label-text text-sm md:text-base text-gray-600">
                    Last Name
                  </span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`input input-bordered w-full bg-white text-sm md:text-base ${
                    errors.lastName ? "input-error" : ""
                  }`}
                />
                {errors.lastName && (
                  <p className="text-error text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full bg-white pr-10 text-sm md:text-base ${
                    errors.password ? "input-error" : ""
                  }`}
                />
                {errors.password && (
                  <p className="text-error text-xs mt-1">{errors.password}</p>
                )}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Confirm Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full bg-white pr-10 text-sm md:text-base ${
                    errors.confirmPassword || !passwordsMatch
                      ? "input-error"
                      : ""
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-error text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
                {!passwordsMatch && (
                  <p className="text-error text-xs mt-1">
                    Passwords do not match
                  </p>
                )}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                className="checkbox checkbox-sm mt-1 mr-2"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="label-text text-sm md:text-base text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-indigo-600">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600">
                  Privacy Policy
                </a>
              </span>
            </div>
            {errors.general && (
              <p className="text-error text-sm">{errors.general}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full border-none text-sm md:text-base"
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm md:text-base text-gray-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-indigo-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
      <ChatIllustration />
    </div>
  );
};

export default SignUp;
