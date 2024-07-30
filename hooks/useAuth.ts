"use client"
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/types";
import { toast } from "react-hot-toast";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseClient";
import axios from 'axios';
import { getAuth } from 'firebase/auth';

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
    if (typeof window !== 'undefined') {
      searchParamsRef.current = new URLSearchParams(window.location.search);
      const errorParam = searchParamsRef.current.get('error');
      if (errorParam) {
        setError("Failed to sign in. Please try again.");
        toast.error("Failed to sign in");
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };



  async function fetchLastConversation() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('No authenticated user');
      }

      const idToken = await user.getIdToken();

      const response = await axios.get('/api/chat/last-conversation', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      return response.data.conversation;

       // statsus ==== 404 then we redrect to
    } catch (error) {
      console.error('Error fetching last conversation:', error);
      throw error;
    }
  }

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
      await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success("Log In Successful");
      await handleSuccessfulLogin();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Log In Successful");
      await handleSuccessfulLogin();
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