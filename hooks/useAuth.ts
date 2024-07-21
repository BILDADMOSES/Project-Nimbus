"use client"
import { useState } from "react";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchLastConversation = async () => {
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
  };

  const handleSuccessfulLogin = async () => {
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
        setError("Invalid email or password");
        toast.error("Invalid email or password");
      } else {
        toast.success("Log In Successful");
        await handleSuccessfulLogin();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signIn("google", { redirect: false });
    if (result?.error) {
      setError("Failed to sign in with Google");
      toast.error("Failed to sign in with Google");
    } else {
      await handleSuccessfulLogin();
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