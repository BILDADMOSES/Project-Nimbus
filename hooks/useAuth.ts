"use client"
import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/types";
import { toast } from "react-hot-toast";

export const useSignIn = () => {
  const [form, setForm] = useState<SignInForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError("Failed to sign in. Please try again.");
      toast.error("Failed to sign in");
    }

    const sessionParam = searchParams.get('session');
    if (sessionParam === 'success') {
      handleSuccessfulLogin();
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const fetchLastConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/last-conversation');
      if (!response.ok) {
        throw new Error('Failed to fetch last conversation');
      }
      const data = await response.json();
      return data.conversation;
    } catch (error) {
      console.error('Error fetching last conversation:', error);
      return null;
    }
  }, []);

  const handleSuccessfulLogin = useCallback(async () => {
    const savedJoinUrl = localStorage.getItem('joinCallbackUrl');
    if (savedJoinUrl) {
      localStorage.removeItem('joinCallbackUrl');
      router.push(savedJoinUrl);
    } else {
      const lastConversation = await fetchLastConversation();
      if (lastConversation) {
        router.push(`/chat/one-on-one?uuid=${lastConversation.id}`);
      } else {
        router.push('/chat/create');
      }
    }
  }, [router, fetchLastConversation]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
        setError("Invalid email or password");
        toast.error("Invalid email or password");
      } else if (result?.ok) {
        toast.success("Log In Successful");
        await handleSuccessfulLogin();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [form, handleSuccessfulLogin]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await signIn("google", { 
        callbackUrl: `${window.location.origin}/api/auth/google-callback` 
      });
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError("Failed to sign in with Google");
      toast.error("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    form,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    error,
    isLoading,
  };
};