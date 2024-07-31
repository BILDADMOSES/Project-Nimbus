"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ChatIllustration from "@/components/common/ChatIllustration";
import { useSession } from "next-auth/react";

const JoinPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const tokenOrId = searchParams.get("token");
    if (!tokenOrId) {
      setError("Invalid join link");
      return;
    }

    const validateInvitation = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(`/chat/join?token=${tokenOrId}`)}`);
        return;
      }

      setIsValidating(true);
      try {
        const response = await fetch(`/api/chat/join/${tokenOrId}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Failed to join");
        }

        const data = await response.json();

        setIsRedirecting(true);
        setTimeout(() => {
          if (data.type === "conversation") {
            router.push(`/chat/one-on-one?uuid=${data.id}`);
          } else if (data.type === "group") {
            router.push(`/chat/group/${data.id}`);
          } else {
            throw new Error("Invalid chat type");
          }
        }, 2000);
      } catch (error) {
        setError("Failed to join. The invitation might be invalid or expired.");
      } finally {
        setIsValidating(false);
      }
    };

    validateInvitation();
  }, [searchParams, router, status]);

  const renderStatus = () => {
    if (isValidating) {
      return (
        <div className="text-center">
          <progress className="progress w-56"></progress>
          <p className="mt-4 text-sm md:text-base text-gray-600">
            Validating invitation...
          </p>
        </div>
      );
    }

    if (error) {
      return (
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
              d="M10 14l2-2m0 0l2-2m-2 2l2 2m2-2l-2-2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      );
    }

    if (!isValidating && !error && isRedirecting) {
      return (
        <div className="alert flex flex-col alert-success">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>You've successfully joined the chat! Redirecting...</span>
          <div className="flex justify-center mt-2">
            <progress className="progress w-56"></progress>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center"
    >
      <div className="w-full max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
          Joining Chat
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
          {isValidating
            ? "We're processing your request..."
            : "Welcome to the conversation!"}
        </p>

        {renderStatus()}

        <button
          onClick={() => router.push("/")}
          className="btn btn-primary w-full mt-6"
        >
          Go to Home
        </button>
      </div>
    </motion.div>
  );
};

const JoinPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Suspense fallback={<div>Loading...</div>}>
        <JoinPageContent />
      </Suspense>
      <ChatIllustration />
    </div>
  );
};

export default JoinPage;