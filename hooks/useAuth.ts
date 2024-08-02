"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/types";
import { toast } from "react-hot-toast";
import axios from "axios";
import { signIn } from "next-auth/react";

export const useSignIn = () => {
  const [form, setForm] = useState<SignInForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParamsRef = useRef<URLSearchParams | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      searchParamsRef.current = new URLSearchParams(window.location.search);
      const errorParam = searchParamsRef.current.get("error");
      if (errorParam) {
        setError("Failed to sign in. Please try again.");
        toast.error("Failed to sign in");
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function fetchLastChat() {
    try {
      const response = await axios.get("/api/chat/last-chat", {
        withCredentials: true,
      });

      return response.data.chat;
    } catch (error) {
      console.error("Error fetching last chat:", error);
      throw error;
    }
  }

  const handleSuccessfulLogin = async () => {
    const callbackUrl = searchParamsRef.current?.get("callbackUrl");
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      const savedJoinUrl = localStorage.getItem("joinCallbackUrl");
      if (savedJoinUrl) {
        localStorage.removeItem("joinCallbackUrl");
        router.push(savedJoinUrl);
      } else {
        const lastChat = await fetchLastChat();
        if (lastChat) {
          switch (lastChat.type) {
            case 'conversation':
              router.push(`/chat/one-on-one?uuid=${lastChat.id}`);
              break;
            case 'aiChat':
              router.push(`/chat/ai?uuid=${lastChat.id}`);
              break;
            case 'group':
              router.push(`/chat/group?uuid=${lastChat.id}`);
              break;
            default:
              console.error('Unknown chat type:', lastChat.type);
              router.push("/chat/create");
          }
        } else {
          router.push("/chat/create");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result?.error) {
        setError(result.error);
        toast.error("Invalid email or password");
      } else {
        toast.success("Log In Successful");
        await handleSuccessfulLogin();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      toast.error("Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const callbackUrl = searchParamsRef.current?.get("callbackUrl");
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: callbackUrl || undefined,
      });

      if (result?.error) {
        setError(result.error);
        toast.error("Failed to sign in with Google");
      } else {
        toast.success("Log In Successful");
        await handleSuccessfulLogin();
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err.message || "Failed to sign in with Google");
      toast.error("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    error,
    isLoading,
  };
};